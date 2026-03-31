package services

import (
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"time"

	"media-service/cmd/media/repositories"
	"media-service/infrastructure/logger"
	"media-service/model"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type MediaStorage interface {
	UploadFile(ctx context.Context, fileHeader *multipart.FileHeader) (*model.Media, error)
	UploadFiles(ctx context.Context, filesHeader []*multipart.FileHeader) ([]*model.Media, error)
	DeleteFile(ctx context.Context, id string) error
	DeleteFiles(ctx context.Context, ids []string) error
	GetMediaByID(ctx context.Context, id string) (*model.Media, error)
}

type cloudinaryService struct {
	repo       repositories.MediaRepository
	cld        *cloudinary.Cloudinary
	folderName string
	Redis      *redis.Client
}

func NewMediaService(repo repositories.MediaRepository, cldURL string, folder string, redis *redis.Client) MediaStorage {
	cld, err := cloudinary.NewFromURL(cldURL)
	if err != nil {
		// Gunakan context Background untuk inisialisasi awal, lalu panic agar fail-fast
		ctx := context.Background()
		logger.Error(ctx, "service:media", "Failed to initialize Cloudinary SDK", err, nil)
		panic(err)
	}

	return &cloudinaryService{
		repo:       repo,
		cld:        cld,
		folderName: folder,
		Redis:      redis,
	}
}

func (s *cloudinaryService) UploadFile(ctx context.Context, fileHeader *multipart.FileHeader) (*model.Media, error) {
	file, err := fileHeader.Open()
	if err != nil {
		logger.Error(ctx, "service:media", "Failed to open multipart file", err, logrus.Fields{
			"file_name": fileHeader.Filename,
		})
		return nil, err
	}
	defer file.Close()

	logger.Debug(ctx, "service:media", "Starting file upload to Cloudinary", logrus.Fields{
		"file_name": fileHeader.Filename,
		"folder":    s.folderName,
	})

	// 1. Upload ke Cloudinary
	resp, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: s.folderName,
	})
	if err != nil {
		logger.Error(ctx, "service:media", "Failed to upload file to Cloudinary", err, logrus.Fields{
			"file_name": fileHeader.Filename,
		})
		return nil, err
	}

	// 2. Siapkan metadata untuk disimpan ke DB
	media := &model.Media{
		FileName:  fileHeader.Filename,
		FileURL:   resp.SecureURL,
		PublicID:  resp.PublicID,
		MediaType: resp.ResourceType,
	}

	// 3. Simpan metadata ke DB via Repository
	result, err := s.repo.Create(ctx, media)
	if err != nil {
		logger.Error(ctx, "service:media", "Failed to save media metadata to DB, initiating rollback", err, logrus.Fields{
			"public_id": media.PublicID,
		})

		// 4. Kompensasi: Hapus media dari Cloudinary jika gagal simpan ke DB
		_, rbErr := s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: media.PublicID,
		})
		if rbErr != nil {
			// Jika rollback gagal, ini adalah status CRITICAL (Orphan file terbentuk)
			logger.Error(ctx, "service:media", "CRITICAL: Failed to destroy file in Cloudinary during rollback", rbErr, logrus.Fields{
				"public_id": media.PublicID,
			})
		} else {
			logger.Info(ctx, "service:media", "Rollback successful: Orphan file destroyed in Cloudinary", logrus.Fields{
				"public_id": media.PublicID,
			})
		}

		return nil, err
	}

	logger.Info(ctx, "service:media", "File uploaded and metadata saved successfully", logrus.Fields{
		"media_id":  result.ID,
		"public_id": result.PublicID,
	})
	return result, nil
}

func (s *cloudinaryService) UploadFiles(ctx context.Context, filesHeader []*multipart.FileHeader) ([]*model.Media, error) {
	logger.Info(ctx, "service:media", "Initiating batch file upload", logrus.Fields{
		"total_files": len(filesHeader),
	})

	var filesSuccess []*model.Media

	for idx, fileHeader := range filesHeader {
		file, err := s.UploadFile(ctx, fileHeader)
		if err != nil {
			// Gunakan Warn karena batch tetap berjalan meskipun 1 file gagal
			logger.Warn(ctx, "service:media", fmt.Sprintf("Failed to upload file at index %d, skipping...", idx), logrus.Fields{
				"file_name": fileHeader.Filename,
				"error":     err.Error(),
			})
			continue
		}
		filesSuccess = append(filesSuccess, file)
	}

	logger.Info(ctx, "service:media", "Batch file upload completed", logrus.Fields{
		"successful_uploads": len(filesSuccess),
		"failed_uploads":     len(filesHeader) - len(filesSuccess),
	})

	return filesSuccess, nil
}

func (s *cloudinaryService) DeleteFile(ctx context.Context, id string) error {
	logger.Debug(ctx, "service:media", "Initiating file deletion", logrus.Fields{"media_id": id})

	// 1. Cari data di DB untuk mendapatkan PublicID Cloudinary
	media, err := s.repo.FindByID(ctx, id)
	if err != nil {
		// Log error sudah di-handle oleh repository, cukup kembalikan error
		return err
	}

	// 2. Hapus file fisik di Cloudinary
	_, err = s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: media.PublicID,
	})
	if err != nil {
		logger.Error(ctx, "service:media", "Failed to destroy file in Cloudinary", err, logrus.Fields{
			"public_id": media.PublicID,
		})
		return err
	}

	// 3. Hapus metadata di DB
	err = s.repo.Delete(ctx, media)
	if err != nil {
		// Log error sudah di-handle oleh repository
		return err
	}

	// Invalidate cache
	if s.Redis != nil {
		s.Redis.Del(ctx, "media:"+id)
	}

	logger.Info(ctx, "service:media", "File and metadata deleted successfully", logrus.Fields{
		"media_id": id,
	})
	return nil
}

func (s *cloudinaryService) GetMediaByID(ctx context.Context, id string) (*model.Media, error) {
	cacheKey := "media:" + id
	if s.Redis != nil {
		var cachedMedia model.Media
		val, err := s.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			if err := json.Unmarshal([]byte(val), &cachedMedia); err == nil {
				return &cachedMedia, nil
			}
		}
	}

	media, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache result
	if s.Redis != nil {
		data, _ := json.Marshal(media)
		s.Redis.Set(ctx, cacheKey, data, 5*time.Minute)
	}

	return media, nil
}

func (s *cloudinaryService) DeleteFiles(ctx context.Context, ids []string) error {
	logger.Info(ctx, "service:media", "Batch file deletion", logrus.Fields{
		"total_files": len(ids),
	})

	var failedFinal []string
	const maxRetries = 5

	for _, id := range ids {
		success := false
		for i := 0; i < maxRetries; i++ {
			err := s.DeleteFile(ctx, id)
			if err == nil {
				success = true
				break
			}

			// Log setiap percobaan retry yang gagal
			logger.Warn(ctx, "service:media", fmt.Sprintf("Retrying deletion for media (Attempt %d/%d)", i+1, maxRetries), logrus.Fields{
				"media_id": id,
				"error":    err.Error(),
			})
			time.Sleep(time.Duration(i+1) * 500 * time.Millisecond)
		}

		if !success {
			failedFinal = append(failedFinal, id)
		}
	}

	if len(failedFinal) > 0 {
		err := fmt.Errorf("failed to delete some files after %d retries: %v", maxRetries, failedFinal)
		logger.Error(ctx, "service:media", "Batch deletion completed with errors", err, logrus.Fields{
			"failed_count": len(failedFinal),
		})
		return err
	}

	logger.Info(ctx, "service:media", "Batch file deletion completed successfully", nil)
	return nil
}
