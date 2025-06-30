Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Hello World!" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});