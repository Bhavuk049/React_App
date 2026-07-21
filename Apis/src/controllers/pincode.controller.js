import { z } from "zod";

const pincodeParamSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
});

export async function lookupPincode(req, res) {
  const { code } = pincodeParamSchema.parse(req.params);

  const response = await fetch(`https://api.postalpincode.in/pincode/${code}`);
  if (!response.ok) {
    return res.status(502).json({ error: "PIN code lookup service unavailable" });
  }

  const [result] = await response.json();
  const postOffice = result?.PostOffice?.[0];

  if (result?.Status !== "Success" || !postOffice) {
    return res.status(404).json({ error: "PIN code not found" });
  }

  res.json({
    city: postOffice.District,
    state: postOffice.State,
    country: "India",
  });
}
