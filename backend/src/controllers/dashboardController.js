import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function startDateForRange(range = "monthly") {
  const date = new Date();
  if (range === "daily") date.setDate(date.getDate() - 14);
  else if (range === "weekly") date.setDate(date.getDate() - 84);
  else date.setMonth(date.getMonth() - 12);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateGroup(range = "monthly") {
  if (range === "daily") return { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  if (range === "weekly") return { $dateToString: { format: "%G-W%V", date: "$createdAt" } };
  return { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
}

export const summary = asyncHandler(async (req, res) => {
  const lowThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 5);
  const [
    deliveredRevenue,
    totalOrders,
    totalProducts,
    lowStockProducts,
    pendingOrders,
    customers,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ totalStock: { $gt: 0, $lte: lowThreshold } }),
    Order.countDocuments({ orderStatus: "pending" }),
    Order.distinct("customer.phone"),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  res.json({
    success: true,
    summary: {
      totalRevenue: deliveredRevenue[0]?.total || 0,
      totalOrders,
      totalProducts,
      lowStockProducts,
      pendingOrders,
      totalCustomers: customers.length,
    },
    recentOrders,
  });
});

export const revenue = asyncHandler(async (req, res) => {
  const range = req.query.range || "monthly";
  const data = await Order.aggregate([
    {
      $match: { createdAt: { $gte: startDateForRange(range) }, orderStatus: { $ne: "cancelled" } },
    },
    { $group: { _id: dateGroup(range), revenue: { $sum: "$total" } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: data.map((row) => ({ label: row._id, revenue: row.revenue })) });
});

export const ordersOverTime = asyncHandler(async (req, res) => {
  const range = req.query.range || "monthly";
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: startDateForRange(range) } } },
    { $group: { _id: dateGroup(range), orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: data.map((row) => ({ label: row._id, orders: row.orders })) });
});

export const paymentMethods = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $group: { _id: "$paymentMethod", value: { $sum: 1 } } },
    { $sort: { value: -1 } },
  ]);
  res.json({ success: true, data: data.map((row) => ({ name: row._id, value: row.value })) });
});

export const orderStatuses = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $group: { _id: "$orderStatus", value: { $sum: 1 } } },
    { $sort: { value: -1 } },
  ]);
  res.json({ success: true, data: data.map((row) => ({ name: row._id, value: row.value })) });
});

export const genderSales = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $match: { orderStatus: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.gender",
        units: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
  ]);
  res.json({
    success: true,
    data: data.map((row) => ({ name: row._id, units: row.units, revenue: row.revenue })),
  });
});

export const topProducts = asyncHandler(async (req, res) => {
  const sold = await Order.aggregate([
    { $match: { orderStatus: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 8 },
  ]);

  const productIds = sold.map((row) => row._id);
  const products = await Product.find({ _id: { $in: productIds } }, { totalStock: 1 }).lean();
  const stockById = new Map(products.map((product) => [String(product._id), product.totalStock]));

  res.json({
    success: true,
    products: sold.map((row) => ({
      ...row,
      remainingStock: stockById.get(String(row._id)) || 0,
    })),
  });
});

export const customers = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: "$customer.phone",
        name: { $last: "$customer.name" },
        phone: { $last: "$customer.phone" },
        city: { $last: "$customer.city" },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$total" },
        lastOrder: { $max: "$createdAt" },
      },
    },
    { $sort: { lastOrder: -1 } },
  ]);
  res.json({ success: true, customers: data });
});
