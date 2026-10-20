export async function GET(_: Request, { params }: { params: Promise<{ pin: string }> }) {
  const { pin } = await params;
  if (!/^[1-9]\d{5}$/.test(pin)) return Response.json({ error: "Invalid pincode" }, { status: 400 });
  const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { next: { revalidate: 86400 } })
    .then((x) => x.json()).catch(() => null);
  const o = r?.[0]?.PostOffice?.[0];
  return o ? Response.json({ city: o.District, state: o.State }) : Response.json({ error: "Not found" }, { status: 404 });
}
