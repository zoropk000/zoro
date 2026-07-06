export type Review = {
  name: string;
  city: string;
  rating: number;
  text: string;
};

export const reviews: Review[] = [
  {
    name: "Ahmed",
    city: "Karachi",
    rating: 5,
    text: "Very comfortable shoes. Delivery was quick and size was perfect.",
  },
  {
    name: "Fatima",
    city: "Lahore",
    rating: 5,
    text: "I ordered for my brother. Cash on delivery was so easy. Quality is great.",
  },
  {
    name: "Bilal",
    city: "Islamabad",
    rating: 4,
    text: "Good sneakers for daily use. The rider arrived in 3 days.",
  },
  {
    name: "Ayesha",
    city: "Rawalpindi",
    rating: 5,
    text: "Size guide helped me a lot. Shoes fit perfectly. Highly recommended.",
  },
  {
    name: "Usman",
    city: "Faisalabad",
    rating: 5,
    text: "Original quality. Paid at the door. Very happy with the purchase.",
  },
  {
    name: "Sana",
    city: "Multan",
    rating: 4,
    text: "Beautiful design and comfortable. WhatsApp support was helpful.",
  },
];
