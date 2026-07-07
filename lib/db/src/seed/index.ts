import { eq } from "drizzle-orm";
import { db, pool } from "../index";
import {
  districtsTable,
  taluksTable,
  ministriesTable,
  departmentsTable,
  complaintCategoriesTable,
  rolesTable,
  usersTable,
} from "../schema";
import {
  districtSeeds,
  talukSeeds,
  ministrySeeds,
  departmentSeeds,
  categorySeeds,
  roleSeeds,
} from "./data";

async function seedDistricts(): Promise<Map<string, number>> {
  for (const d of districtSeeds) {
    await db
      .insert(districtsTable)
      .values(d)
      .onConflictDoUpdate({
        target: districtsTable.name,
        set: { nameTa: d.nameTa, code: d.code },
      });
  }
  const rows = await db.select().from(districtsTable);
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function seedTaluks(districtIds: Map<string, number>): Promise<void> {
  for (const t of talukSeeds) {
    const districtId = districtIds.get(t.district);
    if (!districtId) {
      throw new Error(`Unknown district for taluk ${t.name}: ${t.district}`);
    }
    const existing = await db
      .select({ id: taluksTable.id, districtId: taluksTable.districtId })
      .from(taluksTable)
      .where(eq(taluksTable.name, t.name));
    const match = existing.find((row) => row.districtId === districtId);
    if (match) {
      await db
        .update(taluksTable)
        .set({ nameTa: t.nameTa })
        .where(eq(taluksTable.id, match.id));
    } else {
      await db
        .insert(taluksTable)
        .values({ districtId, name: t.name, nameTa: t.nameTa });
    }
  }
}

async function seedMinistries(): Promise<Map<string, number>> {
  for (const m of ministrySeeds) {
    await db
      .insert(ministriesTable)
      .values(m)
      .onConflictDoUpdate({
        target: ministriesTable.name,
        set: { nameTa: m.nameTa, ministerName: m.ministerName },
      });
  }
  const rows = await db.select().from(ministriesTable);
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function seedDepartments(
  ministryIds: Map<string, number>,
): Promise<void> {
  for (const d of departmentSeeds) {
    const ministryId = d.ministry ? (ministryIds.get(d.ministry) ?? null) : null;
    if (d.ministry && ministryId === null) {
      throw new Error(
        `Unknown ministry for department ${d.name}: ${d.ministry}`,
      );
    }
    await db
      .insert(departmentsTable)
      .values({
        ministryId,
        name: d.name,
        nameTa: d.nameTa,
        description: d.description,
      })
      .onConflictDoUpdate({
        target: departmentsTable.name,
        set: { ministryId, nameTa: d.nameTa, description: d.description },
      });
  }
}

async function seedCategories(): Promise<void> {
  for (const c of categorySeeds) {
    await db
      .insert(complaintCategoriesTable)
      .values(c)
      .onConflictDoUpdate({
        target: complaintCategoriesTable.name,
        set: { nameTa: c.nameTa, description: c.description },
      });
  }
}

async function seedRoles(): Promise<void> {
  for (const r of roleSeeds) {
    await db
      .insert(rolesTable)
      .values(r)
      .onConflictDoUpdate({
        target: rolesTable.name,
        set: { nameTa: r.nameTa, description: r.description },
      });
  }
}

async function seedSuperAdmin(): Promise<void> {
  const clerkId = process.env["SUPER_ADMIN_CLERK_ID"];
  const email = process.env["SUPER_ADMIN_EMAIL"] ?? null;
  if (!clerkId) {
    console.log("  super_admin: skipped (SUPER_ADMIN_CLERK_ID not set)");
    return;
  }
  await db
    .insert(usersTable)
    .values({
      clerkId,
      email,
      name: "Super Administrator",
      role: "super_admin",
    })
    .onConflictDoUpdate({
      target: usersTable.clerkId,
      set: { role: "super_admin", email },
    });
  console.log(`  super_admin: seeded (${email ?? clerkId})`);
}

async function main(): Promise<void> {
  console.log("Seeding Tamil Nadu master data...");
  const districtIds = await seedDistricts();
  console.log(`  districts: ${districtSeeds.length}`);
  await seedTaluks(districtIds);
  console.log(`  taluks: ${talukSeeds.length}`);
  const ministryIds = await seedMinistries();
  console.log(`  ministries: ${ministrySeeds.length}`);
  await seedDepartments(ministryIds);
  console.log(`  departments: ${departmentSeeds.length}`);
  await seedCategories();
  console.log(`  complaint categories: ${categorySeeds.length}`);
  await seedRoles();
  console.log(`  roles: ${roleSeeds.length}`);
  await seedSuperAdmin();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
