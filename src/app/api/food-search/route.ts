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

  if (results.length < 3) {
    try {
      const appId = process.env.NUTRITIONIX_APP_ID
      const appKey = process.env.NUTRITIONIX_API_KEY
      if (appId && appKey) {
        const res = await fetch(`https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`, { headers: { 'x-app-id': appId, 'x-app-key': appKey } })
        const data = await res.json()
        const items = [...(data.branded || []), ...(data.common || [])].slice(0, 5 - results.length)
        for (const item of items) results.push({ name: item.food_name, calories: item.nf_calories ? Math.round(item.nf_calories) : null, servingSize: item.serving_unit ? `${item.serving_qty} ${item.serving_unit}` : null, source: 'Nutritionix', sourceUrl: 'https://www.nutritionix.com' })
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json(results.slice(0, 5))
}
