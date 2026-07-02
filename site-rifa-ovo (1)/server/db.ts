import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, rifaReservations, InsertRifaReservation, rifaPayments, InsertRifaPayment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Rifa Reservation Queries
export async function createRifaReservation(reservation: InsertRifaReservation) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  console.log("[Database] Creating reservation:", reservation);
  const result = await db.insert(rifaReservations).values(reservation);
  console.log("[Database] Reservation created:", result);
  return result;
}

export async function getRifaReservations() {
  const db = await getDb();
  if (!db) {
    return [];
  }
  const result = await db.select().from(rifaReservations);
  return result;
}

export async function getReservedNumbers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Database not available for getReservedNumbers");
    return [];
  }
  try {
    const result = await db.select({ number: rifaReservations.number }).from(rifaReservations).where(eq(rifaReservations.paymentStatus, "confirmed"));
    console.log("[Database] Reserved numbers:", result.map(r => r.number));
    return result.map(r => r.number);
  } catch (error) {
    console.error("[Database] Error getting reserved numbers:", error);
    return [];
  }
}

export async function updateReservationPaymentStatus(id: number, status: "pending" | "confirmed" | "cancelled") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db.update(rifaReservations).set({ paymentStatus: status }).where(eq(rifaReservations.id, id));
}

// Rifa Payment Queries
export async function createRifaPayment(payment: InsertRifaPayment) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db.insert(rifaPayments).values(payment);
}

export async function getRifaPayments() {
  const db = await getDb();
  if (!db) {
    return [];
  }
  const result = await db.select().from(rifaPayments);
  return result;
}

export async function updatePaymentStatus(id: number, status: "pending" | "completed" | "failed") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db.update(rifaPayments).set({ status }).where(eq(rifaPayments.id, id));
}
