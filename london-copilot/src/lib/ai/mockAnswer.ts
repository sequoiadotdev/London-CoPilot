function wrapJson(payload: object) {
  return `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``
}

export function buildMockAnswer(query: string): string {
  const q = query.toLowerCase()

  if (q.includes('rent') || q.includes('flat') || q.includes('housing') || q.includes('neighbourhood')) {
    return wrapJson({
      type: 'housing',
      title: 'Neighbourhood snapshot',
      summary:
        'Hackney and Dalston remain strong value picks for renters who want nightlife without central London prices. Transport links are good and the area keeps improving year on year.',
      areas: [
        {
          name: 'Hackney',
          avgRent: '£1,750/mo for 1-bed',
          vibe: 'Creative, lively, and well connected to the City.',
          pros: ['Strong Overground links', 'Great food scene', 'More space for the money'],
          transportScore: 8,
          coordinates: { lng: -0.055, lat: 51.545 },
        },
        {
          name: 'Dalston',
          avgRent: '£1,850/mo for 1-bed',
          vibe: 'Edgy and social with excellent late-night options.',
          pros: ['Victoria Line nearby', 'Independent venues', 'Fast to Shoreditch'],
          transportScore: 8,
          coordinates: { lng: -0.075, lat: 51.546 },
        },
      ],
      tip: 'View flats after 6pm if noise matters — Dalston gets lively on weekends.',
    })
  }

  if (
    q.includes('from') ||
    q.includes('to') ||
    q.includes('route') ||
    q.includes('get to') ||
    q.includes('directions')
  ) {
    return wrapJson({
      type: 'route',
      title: 'Fastest ways across town',
      summary:
        'The Tube is usually the quickest option for cross-London trips at peak times. Walking can beat the bus for short hops in central zones.',
      focus: {
        name: "King's Cross",
        lng: -0.123,
        lat: 51.531,
      },
      options: [
        {
          mode: 'Tube',
          duration: '18 min',
          cost: '£2.80 with Oyster',
          steps: ['Take the Victoria line south', 'Change if needed at Oxford Circus', 'Walk 4 min to destination'],
          emoji: '🚇',
        },
        {
          mode: 'Bus',
          duration: '32 min',
          cost: '£1.75 with Oyster',
          steps: ['Board from the main stop', 'Stay on until the high street', 'Walk 6 min'],
          emoji: '🚌',
        },
      ],
      tip: 'Check Citymapper before leaving — weekend engineering works can add 10–15 minutes.',
    })
  }

  const place = q.includes('shoreditch')
    ? { name: 'Shoreditch', lng: -0.078, lat: 51.525 }
    : q.includes('camden')
      ? { name: 'Camden', lng: -0.143, lat: 51.539 }
      : q.includes('soho')
        ? { name: 'Soho', lng: -0.133, lat: 51.513 }
        : { name: 'Shoreditch', lng: -0.078, lat: 51.525 }

  return wrapJson({
    type: 'itinerary',
    title: `A few hours in ${place.name}`,
    summary:
      'Start with coffee, wander the main streets, then settle somewhere relaxed for food. This is a compact loop that works well on foot.',
    slots: [
      {
        time: 'Morning',
        place: `${place.name} Coffee Spot`,
        description: 'Grab a flat white and walk the side streets before the crowds build.',
        coordinates: { lng: place.lng, lat: place.lat },
        duration: '45 minutes',
        cost: '£4–6',
      },
      {
        time: 'Midday',
        place: `${place.name} Market Lane`,
        description: 'Browse independent shops and street food stalls around the main strip.',
        coordinates: { lng: place.lng + 0.002, lat: place.lat + 0.001 },
        duration: '1 hour',
        cost: 'Free',
      },
      {
        time: 'Afternoon',
        place: `${place.name} Lunch Stop`,
        description: 'Sit down for a relaxed lunch — reservations help on weekends.',
        coordinates: { lng: place.lng - 0.001, lat: place.lat - 0.001 },
        duration: '1.5 hours',
        cost: '£15–25',
      },
    ],
    tip: 'Go mid-week if you can — queues are shorter and the area feels much calmer.',
  })
}

export function extractLastUserText(
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>,
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg?.role !== 'user') continue
    return (
      msg.parts
        ?.filter(part => part.type === 'text')
        .map(part => part.text ?? '')
        .join('') ?? ''
    )
  }
  return 'London recommendations'
}
