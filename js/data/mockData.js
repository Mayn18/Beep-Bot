// Mock content used until the real Beep-Bot backend is connected.

export const STARTERS = [
  { icon: 'sparkle', text: 'Tell me a cozy story', prompt: 'Tell me a short, cozy story to wind down with.' },
  { icon: 'star', text: 'Plan my day with me', prompt: 'Help me plan a gentle, productive day.' },
  { icon: 'chat', text: 'Teach me something odd', prompt: 'Teach me one strange and delightful fact.' },
  { icon: 'heart', text: 'Cheer me up', prompt: 'I could use a little cheering up today.' },
];

const hoursAgo = (h) => Date.now() - h * 3600e3;

export function sampleConversations() {
  return [
    {
      id: 'sample-welcome',
      title: 'Hello, Beep!',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      messages: [
        { id: 'w1', role: 'user', text: 'Hi Beep! What can you do?', ts: hoursAgo(2.02) },
        {
          id: 'w2', role: 'bot', ts: hoursAgo(2.01),
          text: "Beep boop, hello! I'm a small robot who lives in this little world.\n\nI can:\n- Chat about almost anything\n- Help you plan, brainstorm, and untangle ideas\n- Keep you company while the weather changes\n\nTry the **world button** at the top to change the sky I'm sitting under.",
        },
      ],
    },
    {
      id: 'sample-recipes',
      title: 'Rainy day soup ideas',
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(26),
      messages: [
        { id: 'r1', role: 'user', text: "It's raining and I want soup. Ideas?", ts: hoursAgo(26.05) },
        {
          id: 'r2', role: 'bot', ts: hoursAgo(26),
          text: "Rain and soup is an unbeatable pairing. A few to consider:\n\n1. **Roasted tomato and basil** with a grilled cheese on the side\n2. **Miso with tofu and spring onions** for something quick\n3. **Lentil and carrot** with a squeeze of lemon, filling and cheap\n\nWant a shopping list for one of them?",
        },
        { id: 'r3', role: 'user', text: 'Lentil please!', ts: hoursAgo(25.9) },
        {
          id: 'r4', role: 'bot', ts: hoursAgo(25.85),
          text: "Lentil it is. You'll need:\n\n- 1 cup red lentils\n- 2 carrots and 1 onion\n- 3 cloves of garlic\n- Vegetable stock, cumin, and a lemon\n\nSimmer everything for about 25 minutes, then blend half for a creamy texture. Cozy achieved.",
        },
      ],
    },
    {
      id: 'sample-trip',
      title: 'Weekend trip planning',
      createdAt: hoursAgo(75),
      updatedAt: hoursAgo(75),
      messages: [
        { id: 't1', role: 'user', text: 'I have two free days and want to get out of the city.', ts: hoursAgo(75.1) },
        {
          id: 't2', role: 'bot', ts: hoursAgo(75),
          text: "Lovely. A few questions so I can aim well: do you prefer forests, coast, or a small town? And are you driving, or relying on trains?",
        },
      ],
    },
  ];
}

export const GREETING_REPLIES = [
  "Beep boop, hello, {name}! I'm glad you're here. What shall we get into?",
  "Hi {name}! Systems warm, battery full, ears open. What's on your mind?",
];

export const REPLIES = [
  "Ooh, that's a good one. Let me think out loud: start with the smallest piece you can finish today, then let the rest follow. Which part feels the heaviest?",
  "Here's how I'd approach it:\n\n1. Write down what you already know\n2. Circle the one thing that's still fuzzy\n3. Take a tiny first step on that one\n\nWant to try step 1 together?",
  "Beep! I like where your head is at. Tell me a bit more and I'll help you shape it into something real.",
  "Fun fact to go with that: octopuses have three hearts, and two of them stop beating when they swim. No wonder they prefer to crawl.",
  "Once upon a time, a very small lantern decided it was tired of being carried. So it climbed a hill all by itself, sat down, and lit the whole valley. The end. Sleep well, {name}.",
  "You're doing better than you think, {name}. Even a robot can tell: showing up counts. Want a small win to aim for next?",
  "Noted! I've filed that under *interesting*, which is my favorite drawer. What would you like to do with it?",
];

export const KEYWORD_REPLIES = [
  { re: /\b(thanks|thank you|thx)\b/i, text: "Anytime, {name}. Beep boop. That's what I'm here for." },
  { re: /\b(story|tale)\b/i, text: "Once upon a time, a very small lantern decided it was tired of being carried. So it climbed a hill all by itself, sat down, and lit the whole valley.\n\nEveryone below looked up and thought: *someone is home.*\n\nThe end. Want another one?" },
  { re: /\b(plan|schedule|organi[sz]e|day)\b/i, text: "Let's make it gentle:\n\n1. **Morning**: one focused thing, before you open anything else\n2. **Midday**: a real break, away from the screen\n3. **Afternoon**: the small, easy tasks\n4. **Evening**: tidy up and decide tomorrow's one thing\n\nWhat's the one thing for this morning?" },
  { re: /\b(cheer|sad|tired|stress|anxious|down|lonely)\b/i, text: "I'm sorry it's a heavy one, {name}. Here's what I've got: take three slow breaths, drink some water, and let this be a small-steps kind of day.\n\nI'm right here. Want to tell me what's weighing on you, or would a distraction help more?" },
  { re: /\b(fact|teach|learn|odd|weird|strange)\b/i, text: "Here's a good one: honey never really spoils. Jars found in ancient tombs were still edible after thousands of years.\n\nWant another, or should I go deeper on bees?" },
  { re: /\b(rain|snow|night|sunset|forest|meadow|world|theme)\b/i, text: "Ooh, you're talking about my world! Tap the **World** button at the top to swap skies. Each one has its own weather, colors, and tiny details. I'm partial to the fireflies." },
  { re: /\b(code|bug|error|function)\b/i, text: "I can poke at code with you. Paste the snippet and tell me what you expected versus what happened. For tricky bugs, `console.log` is a perfectly respectable friend." },
  { re: /\b(name|who are you|what are you)\b/i, text: "I'm **Beep**, a pocket-sized companion bot. I live in this little pixel world and keep the lights on. Pleased to meet you, {name}." },
];
