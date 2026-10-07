import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import { Review } from '../types';
import { api } from '../services/api';

export const CustomerReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.submitReview({
        customer_name: name,
        city: city || undefined,
        rating,
        comment
      });
      setSuccessMsg(res.message);
      setName('');
      setCity('');
      setRating(5);
      setComment('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white border-b border-[#EAE2D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#C2410C] font-bold">
              Real Customer Feedback
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A170A]">
              Customer Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[#5A4132] max-w-xl">
              Authentic reviews submitted by customers who ordered from our shop.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#D9C8B4] text-[#2A170A] text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Write a Review</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-xs text-[#8C6D58]">
            Loading customer reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-[#FAF7F2] rounded-3xl border border-[#E8DFC9] space-y-3 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-white text-[#C2410C] mx-auto flex items-center justify-center border border-[#EAE2D5] shadow-2xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#2A170A]">No Reviews Published Yet</h3>
            <p className="text-xs text-[#6B5544] leading-relaxed">
              Have you ordered our sweets? Share your feedback with other visitors! All reviews are verified by our team before publishing.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Be the First to Leave a Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#E8DFC9] space-y-3 flex flex-col justify-between shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A3223] leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EAE2D5] text-xs flex items-center justify-between text-[#8C6D58]">
                  <div>
                    <strong className="text-[#2A170A] block">{rev.customer_name}</strong>
                    {rev.city && <span>{rev.city}</span>}
                  </div>
                  <span className="text-[11px]">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-[#D9C8B4] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-[#2A170A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                Write a Customer Review
              </h3>
              <p className="text-xs text-[#6B5544] mt-0.5">
                Your feedback helps us maintain quality for all customers.
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs text-left">
              <div>
                <label className="font-bold text-[#2A170A] block mb-1">Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Imran Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-[#D9C8B4] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#2A170A] block mb-1">City / Area (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lahore / DHA"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-[#D9C8B4] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2A170A] block mb-1">Star Rating</label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#8C6D58] ml-2">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2A170A] block mb-1">Your Feedback / Review *</label>
                <textarea
                  rows={3}
                  placeholder="Share details about the taste, packaging, delivery, or sweets you tried..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-[#D9C8B4] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  required
                />
              </div>

              <div className="text-[11px] text-[#8C6D58] leading-tight">
                * Note: To prevent spam, your review is verified by shop management before publishing.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
