interface RatingStarsProps {
    rating: number;
}

const RatingStars = ({ rating }: RatingStarsProps) => {
    return (
        <div className="flex text-slate-600">
            {[...Array(5)].map((_, i) => (
                <span key={i}>{i < rating ? "★" : "☆"}</span>
            ))}
        </div>
    );
};

export default RatingStars;
