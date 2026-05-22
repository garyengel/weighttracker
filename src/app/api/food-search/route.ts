import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json([])

  const results: { name: string; calories: number | null; servingSize: string | null; source: string; sourceUrl: string | null }[] = []

  try {
    const usdaKey = process.env.USDA_API_KEY
    if (usdaKey) {
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${usdaKey}`)
      const data = await res.json()
      if (data.foods) {
        for (const food of data.foods.slice(0, 5)) {
          const energy = food.foodNutrients?.find((n: { nutrientId: number; value: number }) => n.nutrientId === 1008)
          if (energy) results.push({ name: food.description, calories: Math.round(energy.value), servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit}` : null, source: 'USDA FoodData Central', sourceUrl: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients` })
        }
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json(results.slice(0, 5))
}
