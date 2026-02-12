package services

import (
	"context"
	"fmt"
	"media-service/cmd/media/repositories"
	"media-service/infrastructure/logger"
	"media-service/model"
	"mime/multipart"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/sirupsen/logrus"
)

// MediaStorage interface untuk memudahkan swapping provider (S3/MinIO)
type MediaStorage interface {
	UploadFile(ctx context.Context, fileHeader *multipart.FileHeader) (*model.Media, error)
	UploadFiles(ctx context.Context, filesHeader []*multipart.FileHeader) ([]*model.Media, error)
	DeleteFile(ctx context.Context, id string) error
	DeleteFiles(ctx context.Context, ids []string) error
}

type cloudinaryService struct {
	repo       repositories.MediaRepository
	cld        *cloudinary.Cloudinary
	folderName string
}

func NewMediaService(repo repositories.MediaRepository, cldURL string, folder string) MediaStorage {
	cld, err := cloudinary.NewFromURL(cldURL)
	if err != nil {
		// Ini akan menghentikan aplikasi daripada panic saat runtime
		logger.Log.Fatalf("Gagal inisialisasi Cloudinary: %v", err)
	}
	return &cloudinaryService{
		repo:       repo,
		cld:        cld,
		folderName: folder,
	}
}

func (s *cloudinaryService) UploadFile(ctx context.Context, fileHeader *multipart.FileHeader) (*model.Media, error) {
	logFields := logrus.Fields{
		"layer":    "Service",
		"func":     "UploadFile",
		"filename": fileHeader.Filename,
	}

	file, err := fileHeader.Open()
	if err != nil {
		logger.LogError(logFields, "Failed to open multipart file", "fileHeader.Open()", err)
		return nil, err
	}
	defer file.Close()

	// 1. Upload ke Cloudinary
	resp, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: s.folderName,
	})
	if err != nil {
		logger.LogError(logFields, "Failed to upload file to Cloudinary", "s.cld.Upload.Upload()", err)
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

		// 4. Delete media from claudinary if err save to db
		_, err = s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: media.PublicID,
		})
		if err != nil {
			logger.LogError(logFields, "Failed to destroy file in Cloudinary", "s.cld.Upload.Destroy()", err)
			return nil, err
		}

		logger.LogError(logFields, "Failed to save file to db", "s.repo.Create()", err)
		return nil, err
	}

	logger.Log.WithFields(logFields).Info("File uploaded and metadata saved successfully")
	return result, nil
}

func (s *cloudinaryService) UploadFiles(ctx context.Context, filesHeader []*multipart.FileHeader) ([]*model.Media, error) {

	logFields := logrus.Fields{
		"layer": "Service",
		"func":  "UploadFiles",
		"files": filesHeader,
	}

	filesSuccess := []*model.Media{}

	for idx, fileHeader := range filesHeader {

		file, err := s.UploadFile(ctx, fileHeader)
		if err != nil {
			logger.LogError(logFields, fmt.Sprintf("Failed to upload file to Cloudinaryn from idx %d", idx), "s.UploadFile()", err)
			continue
		}
		filesSuccess = append(filesSuccess, file)
	}

	return filesSuccess, nil

}

func (s *cloudinaryService) DeleteFile(ctx context.Context, id string) error {
	logFields := logrus.Fields{
		"layer":    "Service",
		"func":     "DeleteFile",
		"media_id": id,
	}

	// 1. Cari data di DB untuk mendapatkan PublicID Cloudinary
	media, err := s.repo.FindByID(ctx, id)
	if err != nil {
		logger.LogError(logFields, "Error find media by ID", "s.repo.FindByID()", err)
		return err
	}

	// 2. Hapus file fisik di Cloudinary
	_, err = s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: media.PublicID,
	})
	if err != nil {
		logger.LogError(logFields, "Failed to destroy file in Cloudinary", "s.cld.Upload.Destroy()", err)
		return err
	}

	// 3. Hapus metadata di DB
	err = s.repo.Delete(ctx, media)
	if err != nil {
		logger.LogError(logFields, "Failed to delete media from database", " s.repo.Delete()", err)
		return err
	}

	logger.Log.WithFields(logFields).Info("File and metadata deleted successfully")
	return nil
}

func (s *cloudinaryService) DeleteFiles(ctx context.Context, ids []string) error {
	logFields := logrus.Fields{
		"layer": "Service",
		"func":  "DeleteFiles",
	}

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
			logger.LogError(logFields, "Failed to delete media", "  s.DeleteFile()", err)
			time.Sleep(time.Duration(i+1) * 500 * time.Millisecond)
		}

		// Jika setelah maxRetries masih gagal juga
		if !success {
			failedFinal = append(failedFinal, id)
		}
	}

	// Jika ada ID yang benar-benar gagal setelah semua percobaan
	if len(failedFinal) > 0 {
		return fmt.Errorf("beberapa file gagal dihapus setelah %d percobaan: %v", maxRetries, failedFinal)
	}

	return nil
}
