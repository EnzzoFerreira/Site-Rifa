CREATE TABLE `rifa_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservationId` int NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`pixKey` varchar(255) NOT NULL,
	`transactionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rifa_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rifa_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`pixKey` varchar(255) NOT NULL,
	`paymentStatus` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentAmount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rifa_reservations_id` PRIMARY KEY(`id`)
);
