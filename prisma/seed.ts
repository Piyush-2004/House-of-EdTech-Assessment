import { prisma } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const candidatePasswordHash = await bcrypt.hash("candidate123", 10);

  // Clean existing seed users if they exist
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["admin@interviewprep.com", "candidate@interviewprep.com"]
      }
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@interviewprep.com",
      passwordHash: adminPasswordHash,
      name: "Admin User",
      role: "admin",
    },
  });

  const candidate = await prisma.user.create({
    data: {
      email: "candidate@interviewprep.com",
      passwordHash: candidatePasswordHash,
      name: "John Doe",
      role: "candidate",
    },
  });

  console.log("Seeding completed successfully:");
  console.log(`Admin user seeded: ${admin.email}`);
  console.log(`Candidate user seeded: ${candidate.email}`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  });
