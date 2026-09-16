-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th9 16, 2026 lúc 05:44 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `food_app`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `menu`
--

CREATE TABLE `menu` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `img` varchar(500) NOT NULL,
  `is_sold_out` tinyint(1) DEFAULT 0,
  `seller_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `menu`
--

INSERT INTO `menu` (`id`, `name`, `price`, `img`, `is_sold_out`, `seller_id`) VALUES
(1, 'Bánh Đa Bề Bề', 45000, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400', 0, NULL),
(2, 'Bánh Canh Cua', 50000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=400', 0, NULL),
(3, 'Trà Bạc Hà Sữa Đặc Nóng', 25000, 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?w=400', 0, NULL),
(4, 'Cơm Tấm Sườn Bì', 55000, 'https://images.unsplash.com/photo-1615486171448-4fed39eb8807?w=400', 1, NULL),
(5, 'minhdzvl', 9, 'https://kenh14.vn/sao-doraemon-lai-lua-doc-gia-suot-55-nam-215251224164936806.chn', 0, NULL),
(6, '1', 1, 'http://localhost:5000/uploads/1789526607525.jpg', 1, 8),
(7, '1', 1, 'http://localhost:5000/uploads/1789528983411.jpg', 0, 15);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `role` varchar(10) DEFAULT 'user',
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_category` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `is_open` tinyint(1) DEFAULT 0,
  `avatar` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `email`, `phone`, `password`, `is_verified`, `role`, `shop_name`, `shop_category`, `is_published`, `is_open`, `avatar`) VALUES
(3, '1@2.com', '0912345678', 'Minhpro2k4!', 1, 'user', NULL, NULL, 0, 0, NULL),
(15, '1@3.com', '0912345677', '1', 1, 'seller', '1', '1', 1, 1, 'http://localhost:5000/uploads/1789528936191.jpg');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
