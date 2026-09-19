"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getJobs() {
  return prisma.job.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createJob(data) {
  const job = await prisma.job.create({ data });
  revalidatePath("/");
  return job;
}

export async function updateJobStage(id, stage) {
  const job = await prisma.job.update({
    where: { id },
    data: { stage },
  });
  revalidatePath("/");
  return job;
}

export async function updateJob(id, data) {
  const job = await prisma.job.update({
    where: { id },
    data,
  });
  revalidatePath("/");
  return job;
}

export async function deleteJob(id) {
  await prisma.job.delete({ where: { id } });
  revalidatePath("/");
}