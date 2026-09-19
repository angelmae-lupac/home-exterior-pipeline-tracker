// Maps a Prisma Job row (DB shape) into the shape your UI components expect.
// DB: service (string), estimateQuantity/estimateRate/estimateTotal (flat), createdAt (Date)
// UI: serviceType (string), estimate: {quantity, rate, total} | null, createdAt (epoch ms)
export function toJobViewModel(row) {
  return {
    id: row.id,
    customerName: row.customerName,
    address: row.address,
    phone: row.phone,
    serviceType: row.service,
    stage: row.stage,
    notes: row.notes || "",
    estimate:
      row.estimateQuantity != null
        ? { quantity: row.estimateQuantity, rate: row.estimateRate, total: row.estimateTotal }
        : null,
    scheduledDate: row.scheduledDate
      ? new Date(row.scheduledDate).toISOString().slice(0, 10)
      : null,
    createdAt: new Date(row.createdAt).getTime(),
  };
}

// Maps a UI-shaped job (built by JobForm's onSave) into the flat shape
// Prisma expects for create/update.
export function toDbData(job) {
  return {
    customerName: job.customerName,
    address: job.address,
    phone: job.phone,
    service: job.serviceType,
    stage: job.stage,
    notes: job.notes || null,
    estimateQuantity: job.estimate?.quantity ?? null,
    estimateRate: job.estimate?.rate ?? null,
    estimateTotal: job.estimate?.total ?? null,
    scheduledDate: job.scheduledDate ? new Date(job.scheduledDate) : null,
  };
}
