-- M-BITE FOOD APP FULL DATABASE DUMP
-- Generated on: 2026-09-22T15:41:20.309Z
-- Database: food_app

CREATE DATABASE IF NOT EXISTS `food_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `food_app`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `role` varchar(10) DEFAULT 'user',
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_category` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `is_open` tinyint(1) DEFAULT 0,
  `avatar` varchar(500) DEFAULT NULL,
  `shop_description` text DEFAULT NULL,
  `shop_address` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `is_blocked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ban_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `email`, `phone`, `password`, `is_verified`, `role`, `shop_name`, `shop_category`, `is_published`, `is_open`, `avatar`, `shop_description`, `shop_address`, `address`, `full_name`, `is_blocked`, `created_at`, `ban_reason`) VALUES
(0, 'admin@mbite.com', '0999999999', '$2b$10$G8NM6MYo18fSzU58dVV4Re5f56obpeAhfJRY3oQdB.v8o8krTSuhS', 1, 'admin', NULL, NULL, 0, 0, 'https://cdn-icons-png.flaticon.com/512/2942/2942813.png', NULL, NULL, NULL, 'Quản Trị Viên Hệ Thống', 0, '2026-09-21 08:54:49', NULL),
(3, '1@2.com', '0123456789', '2', 1, 'user', NULL, NULL, 0, 0, '/uploads/1790001110511.jpg', NULL, NULL, 'số 17/77 xuân la', 'minh', 0, '2026-09-21 08:54:49', NULL),
(16, '1@4.com', '0913245678', '4', 1, 'seller', 'bếp ăn đêm', 'Đồ ăn', 1, 1, '/uploads/1789996193140.jpg', '', '123 xuân la', NULL, NULL, 0, '2026-09-21 08:54:49', NULL),
(17, '1@5.com', '0912365478', '5', 1, 'user', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 0, '2026-09-21 08:54:49', NULL),
(18, '1@3.com', '0973167189', '3', 1, 'seller', 'Minh', 'Đồ ăn', 1, 1, '/uploads/1790007270135.jpeg', '', '123 hn', NULL, NULL, 0, '2026-09-21 08:54:49', NULL),
(20, '1@1.com', '0999999998', '1', 1, 'user', NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 0, '2026-09-22 15:21:31', NULL);

-- --------------------------------------------------------
-- Table structure for table `menu`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `img` varchar(500) NOT NULL,
  `is_sold_out` tinyint(1) DEFAULT 0,
  `seller_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `menu`
INSERT INTO `menu` (`id`, `name`, `price`, `img`, `is_sold_out`, `seller_id`) VALUES
(1, 'Bánh Đa Bề Bề', 45000, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', 0, NULL),
(2, 'Bánh Canh Cua', 50000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=400', 0, NULL),
(3, 'Trà Bạc Hà Sữa Đặc Nóng', 25000, 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?w=400', 0, NULL),
(4, 'Cơm Tấm Sườn Bì', 55000, 'https://images.unsplash.com/photo-1615486171448-4fed39eb8807?w=400', 1, NULL),
(5, 'minhdzvl', 9, 'https://kenh14.vn/sao-doraemon-lai-lua-doc-gia-suot-55-nam-215251224164936806.chn', 0, NULL),
(6, '1', 1, '/uploads/1789526607525.jpg', 1, 8),
(7, '1', 1, '/uploads/1789528983411.jpg', 0, 15),
(8, 'minh', 20, '/uploads/1789610236260.jpg', 0, 16),
(9, '123', 21, '/uploads/1789787428716.jpg', 0, 16),
(10, 'Món cấm', 30000, '', 0, 16);

-- --------------------------------------------------------
-- Table structure for table `orders`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `cart_details` text NOT NULL,
  `total_price` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `note` text DEFAULT NULL,
  `voucher_code` varchar(50) DEFAULT NULL,
  `discount_amount` int(11) DEFAULT 0,
  `cancel_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `orders`
INSERT INTO `orders` (`id`, `user_id`, `seller_id`, `cart_details`, `total_price`, `payment_method`, `status`, `created_at`, `note`, `voucher_code`, `discount_amount`, `cancel_reason`) VALUES
(1, 17, 16, '[{"id":8,"name":"minh","price":2,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 2, 'COD', 'completed', '2026-09-16 23:53:01', NULL, NULL, 0, NULL),
(2, 17, 16, '[{"id":8,"name":"minh","price":2,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 2, 'COD', 'completed', '2026-09-16 23:53:40', NULL, NULL, 0, NULL),
(3, 17, 15, '[{"id":7,"name":"1","price":1,"img":"/uploads/1789528983411.jpg","is_sold_out":0,"seller_id":15,"quantity":1,"shopName":"1"}]', 1, 'COD', 'cancelled', '2026-09-17 00:02:39', NULL, NULL, 0, 'Quán đang tạm thời quá tải đơn'),
(4, 17, 16, '[{"id":8,"name":"minh","price":2,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 2, 'COD', 'completed', '2026-09-17 00:58:55', NULL, NULL, 0, NULL),
(5, 3, 16, '[{"id":8,"name":"minh","price":2,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":8,"shopName":"bếp ăn đêm"}]', 16, 'COD', 'completed', '2026-09-21 06:27:39', NULL, NULL, 0, NULL),
(6, 1, 16, '[{"id":9,"name":"123","price":21,"quantity":2}]', 42, 'COD', 'completed', '2026-09-21 06:31:40', NULL, NULL, 0, NULL),
(7, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 20, 'CK', 'completed', '2026-09-21 06:33:23', NULL, NULL, 0, NULL),
(8, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":8,"shopName":"bếp ăn đêm"}]', 160, 'CK', 'completed', '2026-09-21 06:57:31', NULL, NULL, 0, NULL),
(11, 3, 15, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"},{"id":9,"name":"123","price":21,"img":"/uploads/1789787428716.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"},{"id":7,"name":"1","price":1,"img":"/uploads/1789528983411.jpg","is_sold_out":0,"seller_id":15,"shop_name":"Quán Ăn Hoàng Gia","quantity":1,"shopName":"Quán Ăn Hoàng Gia"}]', 15038, 'COD', 'cancelled', '2026-09-21 07:08:42', 'k hanh vs bans kèm 1 e ny xinh', 'MBITE10', 4, 'Khách hủy: Quán xác nhận quá lâu (quá 5 phút)'),
(12, 3, 15, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"},{"id":7,"name":"1","price":1,"img":"/uploads/1789528983411.jpg","is_sold_out":0,"seller_id":15,"shop_name":"Quán Ăn Hoàng Gia","quantity":1,"shopName":"Quán Ăn Hoàng Gia"}]', 15019, 'CK', 'cancelled', '2026-09-21 07:09:20', NULL, 'MBITE10', 2, 'Khách hủy: Quán xác nhận quá lâu (quá 5 phút)'),
(13, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 15020, 'COD', 'completed', '2026-09-21 07:09:45', NULL, NULL, 0, NULL),
(14, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"},{"id":9,"name":"123","price":21,"img":"/uploads/1789787428716.jpg","is_sold_out":0,"seller_id":16,"shop_name":"bếp ăn đêm","quantity":1,"shopName":"bếp ăn đêm"}]', 15037, 'COD', 'completed', '2026-09-21 07:10:27', NULL, 'MBITE10', 4, NULL),
(15, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 15018, 'COD', 'completed', '2026-09-21 07:32:40', NULL, 'MBITE10', 2, NULL),
(16, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 15020, 'COD', 'completed', '2026-09-21 08:51:15', 'k hanhfvaf 1 em ghệ tone hồng', NULL, 0, NULL),
(17, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 15018, 'COD', 'cancelled', '2026-09-21 09:03:34', NULL, 'MBITE10', 2, 'Quán đang tạm thời quá tải đơn'),
(18, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 15020, 'COD', 'cancelled', '2026-09-21 09:12:49', NULL, NULL, 0, 'Hết món / thiếu nguyên liệu'),
(19, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"},{"id":10,"name":"Món cấm","price":30000,"img":"","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 45020, 'CK', 'cancelled', '2026-09-21 09:29:51', NULL, NULL, 0, 'Hết món / thiếu nguyên liệu'),
(20, 3, 16, '[{"id":10,"name":"Món cấm","price":30000,"img":"","is_sold_out":0,"seller_id":16,"quantity":10,"shopName":"bếp ăn đêm"}]', 315000, 'COD', 'cancelled', '2026-09-21 09:39:59', NULL, NULL, 0, 'Ngoài khoảng cách giao hàng'),
(22, 3, 16, '[{"id":10,"name":"Món cấm","price":30000,"img":"","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 45000, 'CK', 'cancelled', '2026-09-21 09:48:03', NULL, NULL, 0, 'Quán đang tạm thời quá tải đơn'),
(23, 3, 16, '[{"id":9,"name":"123","price":21,"img":"/uploads/1789787428716.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 15021, 'COD', 'completed', '2026-09-22 02:12:53', NULL, NULL, 0, NULL),
(24, 3, 16, '[{"id":10,"name":"Món cấm","price":30000,"img":"","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 45000, 'CK', 'completed', '2026-09-22 02:13:37', NULL, NULL, 0, NULL),
(25, 3, 16, '[{"id":8,"name":"minh","price":20,"quantity":1}]', 15018, 'COD', 'completed', '2026-09-22 02:43:09', 'Test voucher used_count', 'MBITE10', 2, NULL),
(26, 3, 16, '[{"id":10,"name":"Món cấm","price":30000,"img":"","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 30000, 'COD', 'completed', '2026-09-22 02:44:34', NULL, 'MINHDZ', 15000, NULL),
(27, 17, 16, '[{"id":8,"name":"minh","price":20,"quantity":1}]', 15018, 'COD', 'completed', '2026-09-22 02:53:50', NULL, 'MBITE10', 2, NULL),
(28, 3, 16, '[{"id":10,"name":"Món cấm","price":30000,"img":"","is_sold_out":0,"seller_id":16,"quantity":2,"shopName":"bếp ăn đêm"}]', 60000, 'COD', 'completed', '2026-09-22 02:56:40', NULL, 'FREESHIP', 15000, NULL),
(29, 3, 16, '[{"id":10,"name":"Món cấm","price":30000,"quantity":7,"seller_id":16}]', 175000, 'COD', 'cancelled', '2026-09-22 03:12:03', 'Test dùng voucher SIEUTIEC50K', 'SIEUTIEC50K', 50000, 'Khách hủy: Quán xác nhận quá lâu (quá 5 phút)'),
(30, 3, 16, '[{"id":8,"name":"minh","price":20,"img":"/uploads/1789610236260.jpg","is_sold_out":0,"seller_id":16,"quantity":1,"shopName":"bếp ăn đêm"}]', 0, 'CK', 'cancelled', '2026-09-22 06:18:12', NULL, 'SIEUDZ', 100000, 'dz thích bán');

-- --------------------------------------------------------
-- Table structure for table `vouchers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'fixed',
  `discount_value` int(11) NOT NULL,
  `max_discount` int(11) DEFAULT 0,
  `min_order` int(11) DEFAULT 0,
  `usage_limit` int(11) DEFAULT 100,
  `used_count` int(11) DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `vouchers`
INSERT INTO `vouchers` (`id`, `code`, `name`, `description`, `discount_type`, `discount_value`, `max_discount`, `min_order`, `usage_limit`, `used_count`, `expires_at`, `is_active`, `created_at`) VALUES
(1, 'MBITE10', 'Giảm 10% tối đa 30k', 'Áp dụng cho mọi đơn hàng (giảm 10%, tối đa 30.000đ)', 'percent', 10, 30000, 0, 500, 2, NULL, 1, '2026-09-21 08:54:49'),
(2, 'FREESHIP', 'Miễn phí giao hàng 15k', 'Áp dụng cho đơn từ 50.000đ', 'fixed', 15000, 15000, 50000, 300, 1, NULL, 1, '2026-09-21 08:54:49'),
(3, 'GIAM20K', 'Giảm 20.000đ', 'Áp dụng cho đơn từ 100.000đ', 'fixed', 20000, 20000, 100000, 200, 0, NULL, 1, '2026-09-21 08:54:49'),
(4, 'SIEUTIEC50K', 'Giảm 50.000đ tiệc lớn', 'Áp dụng cho đơn từ 200.000đ', 'fixed', 50000, 50000, 200000, 100, 1, NULL, 1, '2026-09-21 08:54:49'),
(5, 'MINHDZ', 'siêu ưu đãi', '', 'percent', 50, 0, 0, 100, 1, NULL, 1, '2026-09-21 09:39:19'),
(6, 'SIEUDZ', 'ngon', '', 'fixed', 100000, 0, 0, 100, 0, NULL, 1, '2026-09-22 03:15:25');

-- --------------------------------------------------------
-- Table structure for table `user_vouchers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `user_vouchers`;
CREATE TABLE `user_vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `voucher_id` int(11) NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_voucher` (`user_id`,`voucher_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_voucher_id` (`voucher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `user_vouchers`
INSERT INTO `user_vouchers` (`id`, `user_id`, `voucher_id`, `is_used`, `created_at`, `used_at`) VALUES
(1, 3, 4, 1, '2026-09-22 03:11:50', '2026-09-22 03:12:03'),
(3, 3, 3, 0, '2026-09-22 03:14:27', NULL),
(4, 3, 6, 0, '2026-09-22 03:15:42', NULL);

-- --------------------------------------------------------
-- Table structure for table `ban_appeals`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `ban_appeals`;
CREATE TABLE `ban_appeals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `appeal_reason` text NOT NULL,
  `evidence_info` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_response` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `ban_appeals`
INSERT INTO `ban_appeals` (`id`, `user_id`, `email`, `appeal_reason`, `evidence_info`, `status`, `admin_response`, `created_at`, `updated_at`) VALUES
(2, 3, '1@2.com', 'xin hãy gỡ ban t vô tội', '', 'rejected', 'có cc', '2026-09-21 09:19:48', '2026-09-21 09:20:08'),
(3, 3, '1@2.com', 'lm ơn đi', '', 'approved', '', '2026-09-21 09:20:32', '2026-09-21 09:20:43'),
(4, 16, '1@4.com', 'pls', '', 'approved', 'ok', '2026-09-21 09:21:06', '2026-09-21 09:21:21'),
(5, 16, '1@4.com', 'xin đấy', '', 'approved', '', '2026-09-22 01:22:02', '2026-09-22 01:22:27');

-- --------------------------------------------------------
-- Table structure for table `favorite_shops`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `favorite_shops`;
CREATE TABLE `favorite_shops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_shop` (`user_id`,`shop_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `favorite_shops`
INSERT INTO `favorite_shops` (`id`, `user_id`, `shop_id`, `created_at`) VALUES
(4, 3, 18, '2026-09-22 01:13:50');

SET FOREIGN_KEY_CHECKS = 1;
