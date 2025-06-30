export const loader = async () => {
  return Response.json({
    success: true,
    message: "Vercel deployment working!",
    timestamp: new Date().toISOString()
  });
}; 