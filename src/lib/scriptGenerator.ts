/**
 * Script Generator — Client-side speaking script generator.
 *
 * Generates structured speaking scripts for 8 different roles/contexts.
 * Uses template-based generation with context injection.
 * No server calls. No API keys.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type ScriptRole =
  | "interviewer"
  | "interviewee"
  | "coach"
  | "presenter"
  | "negotiator"
  | "sales"
  | "meeting_facilitator"
  | "speaker";

export interface ScriptMeta {
  role: ScriptRole;
  label: string;
  emoji: string;
  description: string;
  color: string;
  contextPlaceholder: string;
}

export interface GeneratedScript {
  role: ScriptRole;
  context: string;
  sections: ScriptSection[];
  preparation: string[];
  dosAndDonts: { dos: string[]; donts: string[] };
  keyPhrases: string[];
  duration: string;
}

export interface ScriptSection {
  title: string;
  icon: string;
  content: string;
  bullets?: string[];
}

// ─── Role Metadata ───────────────────────────────────────────────────

export const SCRIPT_ROLES: ScriptMeta[] = [
  {
    role: "interviewer",
    label: "Interviewer",
    emoji: "🎯",
    description: "Conducting an interview — ask the right questions",
    color: "#6366f1",
    contextPlaceholder: "E.g. Senior developer position, 3 years experience required, remote team, startup culture...",
  },
  {
    role: "interviewee",
    label: "Interviewee",
    emoji: "💼",
    description: "Being interviewed — present yourself confidently",
    color: "#3b82f6",
    contextPlaceholder: "E.g. Applying for marketing manager, 5 years in digital marketing, led campaigns for Fortune 500...",
  },
  {
    role: "coach",
    label: "Coach / Mentor",
    emoji: "🎓",
    description: "Coaching or mentoring session — guide with empathy",
    color: "#10b981",
    contextPlaceholder: "E.g. Career coaching for junior developer transitioning to senior, struggling with imposter syndrome...",
  },
  {
    role: "presenter",
    label: "Presenter",
    emoji: "🎤",
    description: "Presenting to an audience — keep them engaged",
    color: "#f59e0b",
    contextPlaceholder: "E.g. Quarterly business review for executives, presenting Q3 growth metrics, 30 minutes...",
  },
  {
    role: "negotiator",
    label: "Negotiator",
    emoji: "🤝",
    description: "Business negotiation — reach win-win agreements",
    color: "#ef4444",
    contextPlaceholder: "E.g. Negotiating SaaS contract renewal, client wants 30% discount, current price $50K/year...",
  },
  {
    role: "sales",
    label: "Sales Pitch",
    emoji: "💰",
    description: "Selling a product or service — persuade effectively",
    color: "#f97316",
    contextPlaceholder: "E.g. Pitching project management tool to mid-size agencies, competing with Asana, $29/user/month...",
  },
  {
    role: "meeting_facilitator",
    label: "Meeting Facilitator",
    emoji: "👥",
    description: "Running a productive meeting — drive outcomes",
    color: "#8b5cf6",
    contextPlaceholder: "E.g. Sprint planning meeting for 8-person dev team, 2-week sprint, mobile app project...",
  },
  {
    role: "speaker",
    label: "Toast / Speech",
    emoji: "🗣️",
    description: "Special occasion speech — inspire and connect",
    color: "#ec4899",
    contextPlaceholder: "E.g. Best man speech at wedding, known groom for 10 years, met in college, funny and heartfelt...",
  },
];

// ─── Context Extraction ──────────────────────────────────────────────

interface ExtractedContext {
  keywords: string[];
  isTechnical: boolean;
  isCasual: boolean;
  isBusiness: boolean;
  sentiment: "positive" | "neutral" | "negative";
  language: "en" | "th" | "mixed";
}

function extractContext(text: string): ExtractedContext {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 2);

  const isTechnical = /\b(code|developer|api|software|tech|data|algorithm|system|engineering|program|stack|framework|database|cloud)\b/i.test(lower);
  const isCasual = /\b(fun|casual|friendly|informal|relax|chill|easy|simple|quick|coffee)\b/i.test(lower);
  const isBusiness = /\b(business|company|client|revenue|contract|budget|profit|stakeholder|executive|quarterly|strategy|market)\b/i.test(lower);
  const hasThai = /[\u0E00-\u0E7F]/.test(text);

  const sentiment: "positive" | "neutral" | "negative" = /\b(excited|great| amazing|wonderful|love|fantastic|excellent|growth|success|opportunity)\b/i.test(lower)
    ? "positive"
    : /\b(problem|issue|difficult|challenge|struggle|concern|risk|fail|worried)\b/i.test(lower)
    ? "negative"
    : "neutral";

  return {
    keywords: words.slice(0, 15),
    isTechnical,
    isCasual,
    isBusiness,
    sentiment,
    language: hasThai ? (/[a-zA-Z]{3,}/.test(text) ? "mixed" : "th") : "en",
  };
}

// ─── Template Generators ─────────────────────────────────────────────

function generateInterviewerScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  const techPrefix = ctx.isTechnical ? "their technical approach to" : "";
  return {
    sections: [
      {
        title: "Opening — Set the Tone",
        icon: "👋",
        content: `Thank you for taking the time to speak with me today. I'm looking forward to learning more about your experience${rawContext ? ` with ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"Let me start by giving you a quick overview of the role and our team...\"",
          "\"Feel free to ask questions at any point during our conversation.\"",
          "\"There are no right or wrong answers — I just want to understand your perspective.\"",
        ],
      },
      {
        title: "Background Questions",
        icon: "📋",
        content: "Map their experience to your requirements. Start broad, then go deep.",
        bullets: [
          "\"Walk me through your background — what brought you to this point?\"",
          "\"What attracted you to this opportunity specifically?\"",
          "\"Tell me about a project you're most proud of. What was your role?\"",
          ctx.isTechnical ? "\"Describe your experience with [specific technology]. How did you approach [problem]?\"" : "\"Describe a challenge you faced in your last role. How did you handle it?\"",
        ],
      },
      {
        title: "Deep Dive — Behavioral Questions",
        icon: "🔍",
        content: "Use the STAR method (Situation, Task, Action, Result) to evaluate past behavior.",
        bullets: [
          "\"Tell me about a time when you had to disagree with a decision. What happened?\"",
          "\"Describe a situation where you had to work under a tight deadline.\"",
          "\"How do you handle feedback that you disagree with?\"",
          "\"Give me an example of when you had to influence someone without authority.\"",
        ],
      },
      {
        title: "Scenario Questions",
        icon: "🎯",
        content: "Test how they think on their feet with realistic scenarios.",
        bullets: [
          "\"Imagine you join our team and discover [common challenge]. What would your first 30 days look like?\"",
          "\"If you had to prioritize between speed and quality on a critical deliverable, how would you decide?\"",
          "\"How would you handle a situation where a stakeholder changes requirements mid-project?\"",
        ],
      },
      {
        title: "Closing — Next Steps",
        icon: "✅",
        content: "End positively. Give them a clear picture of what comes next.",
        bullets: [
          "\"That covers what I wanted to ask. What questions do you have for me?\"",
          "\"Here's what the next steps look like — [timeline].\"",
          "\"Thank you for your time. I enjoyed our conversation.\"",
        ],
      },
    ],
    preparation: [
      "Review their resume/portfolio 30 minutes before",
      "Prepare 3-5 must-ask questions tied to the role requirements",
      "Define what 'great' vs 'good' vs 'average' answers look like",
      "Have a scorecard ready with weighted criteria",
      "Brief yourself on the team culture and current challenges",
      "Prepare a realistic salary range if asked",
    ],
    dosAndDonts: {
      dos: [
        "Let them finish speaking — don't interrupt",
        "Take notes on specific examples, not just impressions",
        "Ask follow-up 'why' questions to go deeper",
        "Sell the role — great candidates evaluate you too",
        "Give a realistic preview of the work",
      ],
      donts: [
        "Don't ask leading questions that hint at the 'right' answer",
        "Avoid back-to-back interviews without a break",
        "Don't make promises about timelines you can't keep",
        "Don't focus only on skills — assess cultural fit too",
        "Avoid biased questions about personal life",
      ],
    },
    keyPhrases: [
      "\"Walk me through...\"",
      "\"Tell me about a time when...\"",
      "\"How did you approach...\"",
      "\"What would you do differently?\"",
      "\"Can you give me a specific example?\"",
    ],
    duration: "45-60 minutes",
  };
}

function generateIntervieweeScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Introduction — Your Elevator Pitch",
        icon: "👋",
        content: `Start strong with a concise narrative that connects your background to this specific role${rawContext ? `: ${rawContext.split(",").slice(0, 2).join(", ")}` : ""}.`,
        bullets: [
          "\"Thank you for the opportunity. I'm excited to discuss how my background aligns with this role.\"",
          "\"Over the past [X years], I've specialized in [key area]. Most recently, I [notable achievement].\"",
          "\"What draws me to this position is [specific reason tied to the company/role].\"",
        ],
      },
      {
        title: "Experience Highlights — STAR Stories",
        icon: "⭐",
        content: "Prepare 3-5 stories using the STAR format (Situation → Task → Action → Result).",
        bullets: [
          "Story 1: A challenge you solved (shows problem-solving)",
          "Story 2: A team collaboration win (shows teamwork)",
          "Story 3: A failure and what you learned (shows growth mindset)",
          "Story 4: A leadership moment (shows initiative)",
          "\"For example, when I was at [company], we faced [situation]. My task was [task]. I decided to [action]. The result was [quantifiable result].\"",
        ],
      },
      {
        title: "Answering Tough Questions",
        icon: "💪",
        content: "Anticipate hard questions and prepare frameworks for answering.",
        bullets: [
          "\"What's your biggest weakness?\" → \"I've been working on [genuine area]. Here's what I've done to improve: [specific action].\"",
          "\"Why should we hire you?\" → \"Based on what you've described about the role, my experience in [area] directly maps to your need for [requirement].\"",
          "\"Where do you see yourself in 5 years?\" → \"I'm focused on growing deep expertise in [field]. I see myself [realistic growth path].\"",
          "\"Tell me about a conflict\" → Focus on resolution, not the conflict itself",
        ],
      },
      {
        title: "Questions to Ask Them",
        icon: "🤔",
        content: "Show genuine interest and gather intel to decide if it's the right fit.",
        bullets: [
          "\"What does success look like in this role after 6 months?\"",
          "\"What's the biggest challenge the team is currently facing?\"",
          "\"How would you describe the team culture?\"",
          "\"What does the onboarding process look like?\"",
          "\"Is there anything about my background that gives you hesitation?\"",
        ],
      },
      {
        title: "Closing — Leave a Strong Impression",
        icon: "✅",
        content: "End with enthusiasm and clarity.",
        bullets: [
          "\"Based on our conversation, I'm even more excited about this opportunity.\"",
          "\"Is there anything else I can share to help with your evaluation?\"",
          "\"What are the next steps in the process?\"",
          "\"Thank you for your time. I really enjoyed learning more about the team.\"",
        ],
      },
    ],
    preparation: [
      "Research the company: mission, recent news, competitors",
      "Study the job description — map each requirement to your experience",
      "Prepare 3-5 STAR stories covering different competencies",
      "Practice answering out loud — not just in your head",
      "Prepare 3-5 thoughtful questions to ask the interviewer",
      "Plan your outfit and tech setup (if virtual) the night before",
      "Get the interviewer's name(s) and LinkedIn profiles",
    ],
    dosAndDonts: {
      dos: [
        "Pause for 2-3 seconds before answering — it shows thoughtfulness",
        "Use specific numbers and examples whenever possible",
        "Mirror the interviewer's energy level",
        "Send a thank-you email within 24 hours",
        "Be honest about what you don't know — then show how you'd learn",
      ],
      donts: [
        "Don't badmouth previous employers or colleagues",
        "Avoid 'we' when you should say 'I' — own your contributions",
        "Don't ask about salary/vacation before they bring it up",
        "Don't give vague answers — always back claims with examples",
        "Avoid filler words (um, like, you know) — practice eliminating them",
      ],
    },
    keyPhrases: [
      "\"That's a great question. Let me think about that for a moment...\"",
      "\"In my experience, I've found that...\"",
      "\"What I learned from that situation is...\"",
      "\"I'd love to hear more about [specific topic].\"",
      "\"Based on what you've shared, I think my experience with [X] could help with [Y].\"",
    ],
    duration: "45-60 minutes",
  };
}

function generateCoachScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Opening — Create a Safe Space",
        icon: "💚",
        content: `Start by establishing trust and setting the frame for the session${rawContext ? ` about ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"Thank you for being here. How are you feeling coming into today's session?\"",
          "\"What would make this conversation most valuable for you?\"",
          "\"There's no judgment here — this is your space to think out loud.\"",
          "\"Before we dive in, I want to check — is there anything pressing on your mind?\"",
        ],
      },
      {
        title: "Discovery — Understand Their World",
        icon: "🔍",
        content: "Ask powerful questions that create self-awareness, not just information gathering.",
        bullets: [
          "\"What's been on your mind since our last conversation?\"",
          "\"When you think about [their challenge], what's the part that feels hardest?\"",
          "\"What have you already tried? What happened?\"",
          "\"If you could wave a magic wand, what would be different?\"",
          "\"What does success look like for you in this situation?\"",
        ],
      },
      {
        title: "Exploration — Reframe & Illuminate",
        icon: "💡",
        content: "Help them see their situation from new angles without telling them what to do.",
        bullets: [
          "\"I'm noticing you said [X]. What's behind that?\"",
          "\"What would [someone they admire] do in this situation?\"",
          "\"What's the story you're telling yourself about this? Is it the only story?\"",
          "\"On a scale of 1-10, where are you? What would move you one point higher?\"",
          "\"What are you assuming that might not be true?\"",
        ],
      },
      {
        title: "Action — Commit to Next Steps",
        icon: "🎯",
        content: "Guide them toward concrete, achievable actions they own.",
        bullets: [
          "\"Based on what we've discussed, what feels like the most important thing to focus on?\"",
          "\"What's one small step you could take this week?\"",
          "\"What might get in the way? How will you handle that?\"",
          "\"How will you know you've made progress?\"",
          "\"On a scale of 1-10, how committed are you to this action? What would make it a 10?\"",
        ],
      },
      {
        title: "Closing — Affirm & Encourage",
        icon: "🌟",
        content: "End with acknowledgment and forward energy.",
        bullets: [
          "\"I want to acknowledge [specific thing they showed courage on].\"",
          "\"To summarize, you're going to [their commitment]. Is that right?\"",
          "\"I believe in your ability to do this. You've already shown [evidence].\"",
          "\"I'm looking forward to hearing how it goes next session.\"",
        ],
      },
    ],
    preparation: [
      "Review notes from the last session",
      "Prepare 3-5 powerful questions based on their current situation",
      "Set a clear intention: 'What does this person need from me today?'",
      "Create a comfortable, private environment",
      "Have a framework ready (GROW, OSCAR, or CLEAR model)",
      "Prepare a backup exercise or visualization if they get stuck",
    ],
    dosAndDonts: {
      dos: [
        "Listen more than you speak (80/20 rule)",
        "Reflect back what you hear — 'What I'm hearing is...'",
        "Celebrate small wins and progress",
        "Be comfortable with silence — let them think",
        "Follow up on commitments from previous sessions",
      ],
      donts: [
        "Don't give advice unless they specifically ask",
        "Avoid 'you should' language",
        "Don't solve their problems for them",
        "Don't judge or express disappointment",
        "Avoid comparing them to other clients",
      ],
    },
    keyPhrases: [
      "\"Tell me more about that...\"",
      "\"What's stopping you?\"",
      "\"And what else?\"",
      "\"What would you advise a friend in this situation?\"",
      "\"I'm curious about...\"",
    ],
    duration: "45-60 minutes",
  };
}

function generatePresenterScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Hook — Grab Attention (30 seconds)",
        icon: "🎣",
        content: `Open with something that makes the audience lean in${rawContext ? ` about ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"Did you know that [surprising statistic]? That changes everything about how we think about [topic].\"",
          "\"Three years ago, I was sitting where you are, and I had no idea that [revelation].\"",
          "\"What if I told you that [provocative statement]? By the end of this presentation, you'll understand why.\"",
          "\"I'm going to share something today that could [impact/benefit]. Here's the thing — [tension/contrast].\"",
        ],
      },
      {
        title: "Roadmap — Set Expectations",
        icon: "🗺️",
        content: "Tell them where you're going so they can follow along.",
        bullets: [
          "\"Over the next [X minutes], I'll cover three things: [point 1], [point 2], and [point 3].\"",
          "\"By the end, you'll walk away with [concrete takeaway].\"",
          "\"Feel free to hold questions until the end, or jot them down as we go.\"",
        ],
      },
      {
        title: "Body — Your Key Points",
        icon: "📊",
        content: "Structure with 3 key points. Each point: Statement → Evidence → Example → Takeaway.",
        bullets: [
          "Point 1: [Main claim]. Evidence: [data/research]. Example: [story/case study]. Takeaway: [so what?]",
          "Point 2: [Main claim]. Evidence: [data/research]. Example: [story/case study]. Takeaway: [so what?]",
          "Point 3: [Main claim]. Evidence: [data/research]. Example: [story/case study]. Takeaway: [so what?]",
          "\"Let me illustrate this with a real example...\"",
          "\"Here's where it gets interesting...\"",
        ],
      },
      {
        title: "Climax — Your Key Message",
        icon: "⚡",
        content: "This is the moment everything builds toward. Make it memorable.",
        bullets: [
          "\"So what does all this mean? [Pause] It means [key insight].\"",
          "\"The bottom line is this: [one powerful sentence].\"",
          "\"If you remember nothing else from today, remember this: [core message].\"",
        ],
      },
      {
        title: "Close — Call to Action",
        icon: "🎯",
        content: "End with energy and a clear ask.",
        bullets: [
          "\"Here's what I'm asking you to do: [specific action].\"",
          "\"The question isn't whether [change will happen]. It's whether you'll lead it.\"",
          "\"Let's open it up for questions. Who wants to go first?\"",
          "\"Thank you. I'll be around after if you want to chat more.\"",
        ],
      },
    ],
    preparation: [
      "Know your audience — research who will be in the room",
      "Prepare your slides (if using) — max 1 idea per slide",
      "Practice the full run-through at least 3 times",
      "Time yourself — aim for 10% under the allocated time",
      "Prepare for 3 likely questions and 1 hostile question",
      "Test all tech 30 minutes before (projector, mic, clicker)",
      "Have a backup plan if tech fails (printed notes)",
    ],
    dosAndDonts: {
      dos: [
        "Start strong — first 30 seconds set the tone",
        "Use the 'rule of three' for key points",
        "Make eye contact with different parts of the room",
        "Use pauses for emphasis — silence is powerful",
        "Tell stories, not just data — people remember stories",
      ],
      donts: [
        "Don't read from your slides — they support you, not replace you",
        "Avoid filler words (um, uh, basically, actually)",
        "Don't rush — speak 20% slower than feels natural",
        "Don't end with 'Any questions?' — end with a strong statement",
        "Avoid jargon unless the audience expects it",
      ],
    },
    keyPhrases: [
      "\"Let me put this in perspective...\"",
      "\"Here's what the data tells us...\"",
      "\"Now, here's the surprising part...\"",
      "\"What this means for you is...\"",
      "\"Let's take a step back and look at the big picture...\"",
    ],
    duration: "15-45 minutes (adjust to context)",
  };
}

function generateNegotiatorScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Opening — Build Rapport",
        icon: "🤝",
        content: `Start by establishing common ground before getting to business${rawContext ? ` regarding ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"Thank you for making time for this. I value our [relationship/partnership].\"",
          "\"I'd like to start by understanding your perspective, then share mine. Does that work?\"",
          "\"My goal today is to find something that works well for both of us.\"",
        ],
      },
      {
        title: "Discovery — Understand Their Position",
        icon: "🔍",
        content: "Ask questions to uncover their real interests, not just their stated position.",
        bullets: [
          "\"Help me understand — what's most important to you in this arrangement?\"",
          "\"What would an ideal outcome look like from your side?\"",
          "\"Are there constraints I should be aware of?\"",
          "\"What happens if we don't reach an agreement?\"",
        ],
      },
      {
        title: "Present Your Position",
        icon: "📋",
        content: "Frame your ask in terms of mutual value, not demands.",
        bullets: [
          "\"From our perspective, here's what we're looking for and why...\"",
          "\"The value we bring to the table includes [specific benefits].\"",
          "\"We've looked at market benchmarks, and [data point] suggests [fair range].\"",
          "\"I want to be transparent — our priorities are [ranked list].\"",
        ],
      },
      {
        title: "Bargain — Exchange Value",
        icon: "⚖️",
        content: "Trade concessions strategically. Never give without getting.",
        bullets: [
          "\"I can be flexible on [less important item] if we can align on [important item].\"",
          "\"What if we structured it as [creative alternative]?\"",
          "\"Let me propose a different angle: [conditional offer].\"",
          "\"I understand your position. Here's what I could do if you could move on [item]: [trade].\"",
        ],
      },
      {
        title: "Close — Lock In Agreement",
        icon: "✅",
        content: "Summarize commitments and clarify next steps.",
        bullets: [
          "\"Let me make sure I've captured everything correctly... [summarize]\"",
          "\"So we've agreed on [points]. Is there anything I've missed?\"",
          "\"What's the best way to formalize this?\"",
          "\"I'm confident this sets us up for a great [partnership/arrangement].\"",
        ],
      },
    ],
    preparation: [
      "Define your BATNA (Best Alternative To Negotiated Agreement)",
      "Know your walk-away point before entering the room",
      "Research the other party's interests and constraints",
      "Prepare data to support your position (market rates, benchmarks)",
      "Identify what you can trade — rank priorities: must-have, nice-to-have, tradable",
      "Prepare a written summary template to capture agreements",
      "Rehearse your opening statement and first offer",
    ],
    dosAndDonts: {
      dos: [
        "Listen more than you speak — information is power",
        "Anchor with a specific number, not a range",
        "Use silence after making an offer — let them respond first",
        "Frame everything as solving a shared problem",
        "Get agreements in writing immediately after",
      ],
      donts: [
        "Don't make the first concession — let them move first",
        "Avoid showing desperation or urgency",
        "Don't negotiate against yourself (making another offer before they respond)",
        "Never accept the first offer without discussion",
        "Don't make threats — use consequences calmly",
      ],
    },
    keyPhrases: [
      "\"Help me understand...\"",
      "\"What would it take to make this work?\"",
      "\"I appreciate that perspective. Here's how I see it...\"",
      "\"Let's find a way to make this a win for both sides.\"",
      "\"Can we explore another option?\"",
    ],
    duration: "30-90 minutes",
  };
}

function generateSalesScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Opening — Earn the Right to Continue",
        icon: "🎯",
        content: `Start with a pattern interrupt that creates curiosity${rawContext ? ` related to ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"I know you weren't expecting to hear about [topic] today, so I'll be brief. Is that okay?\"",
          "\"Most [their role] I talk to are struggling with [common pain point]. Is that something you're seeing?\"",
          "\"I have 30 seconds before you decide if this is worth your time. Fair?\"",
          "\"I'm not here to sell you anything today. I'm here to see if there's a fit.\"",
        ],
      },
      {
        title: "Discovery — Uncover Pain",
        icon: "🩺",
        content: "Ask questions that make the prospect articulate their own need.",
        bullets: [
          "\"What's the biggest challenge you're facing with [area] right now?\"",
          "\"How is that impacting your [revenue/time/team morale]?\"",
          "\"Have you tried to solve this before? What happened?\"",
          "\"If you could fix one thing about [process], what would it be?\"",
          "\"What happens if this doesn't get solved? [pause] And then what?\"",
        ],
      },
      {
        title: "Pitch — Connect Value to Pain",
        icon: "💡",
        content: "Position your solution as the answer to THEIR specific problem.",
        bullets: [
          "\"Based on what you've told me, here's how [product] specifically addresses [their pain]:\"",
          "\"Our clients in [their industry] typically see [specific result] within [timeframe].\"",
          "\"Let me show you a quick example. [Demo/story of similar client]\"",
          "\"The key difference between us and [alternative] is [unique value prop].\"",
        ],
      },
      {
        title: "Handle Objections",
        icon: "🛡️",
        content: "Welcome objections — they show interest. Address them directly.",
        bullets: [
          "\"That's a great point. Can I address it directly?\" → Then do so.",
          "\"Price: I understand. Let's look at the ROI. If [product] saves you [X hours/money], it pays for itself in [timeframe].\"",
          "\"Timing: What changes in 6 months that would make this easier? [pause] What's the cost of waiting?\"",
          "\"Competition: I'd encourage you to compare. Here's what makes us different: [differentiator].\"",
        ],
      },
      {
        title: "Close — Ask for the Business",
        icon: "🏆",
        content: "Don't hint — ask directly. The worst they can say is 'not yet.'",
        bullets: [
          "\"Based on our conversation, do you see [product] solving [their problem]?\"",
          "\"What would you need to see to feel confident moving forward?\"",
          "\"Shall we set up a pilot/trial so you can see the results yourself?\"",
          "\"What's the best next step? I want to make sure we don't lose momentum.\"",
        ],
      },
    ],
    preparation: [
      "Research the prospect's company, role, and recent news",
      "Prepare your value proposition in one sentence",
      "Have 2-3 customer success stories ready (similar industry)",
      "Know your pricing and ROI numbers cold",
      "Prepare responses to top 5 objections",
      "Have a clear ask/call-to-action ready",
      "Practice your 30-second opening until it's natural",
    ],
    dosAndDonts: {
      dos: [
        "Ask questions and genuinely listen to the answers",
        "Mirror their language and pace",
        "Use specific numbers and case studies",
        "Create urgency with value, not pressure",
        "Follow up within 24 hours with a summary",
      ],
      donts: [
        "Don't pitch before understanding their need",
        "Avoid feature-dumping — focus on outcomes",
        "Don't talk more than 40% of the time",
        "Never badmouth competitors",
        "Don't say 'trust me' — show evidence instead",
      ],
    },
    keyPhrases: [
      "\"Help me understand...\"",
      "\"What's your biggest concern about [topic]?\"",
      "\"If we could solve [X], what would that mean for you?\"",
      "\"Let me share a quick example...\"",
      "\"What would need to be true for you to move forward?\"",
    ],
    duration: "15-45 minutes",
  };
}

function generateMeetingScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Opening — Align on Purpose",
        icon: "📋",
        content: `Start with a clear agenda and timebox${rawContext ? ` for ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"Thanks everyone for being here. We have [X minutes] to cover [agenda items]. Does that still work?\"",
          "\"The goal of this meeting is [specific outcome]. By the end, we should have [deliverable].\"",
          "\"Before we start — is there anything urgent that needs to be added to the agenda?\"",
        ],
      },
      {
        title: "Context — Bring Everyone Up to Speed",
        icon: "🔄",
        content: "Quickly establish shared understanding so no one is lost.",
        bullets: [
          "\"Quick context for anyone who's joining fresh: [2-3 sentence background].\"",
          "\"Since our last meeting, [key update]. Here's where we stand: [status].\"",
          "\"The key decision we need to make today is [decision].\"",
        ],
      },
      {
        title: "Discussion — Drive Participation",
        icon: "💬",
        content: "Keep energy up. Draw out quiet voices. Manage loud ones.",
        bullets: [
          "\"[Name], I'd love to hear your perspective on this.\"",
          "\"Let's go around the room — one concern each. No solutions yet, just concerns.\"",
          "\"We're at minute [X]. Let's park this discussion and move to [next item].\"",
          "\"Can someone play devil's advocate here? I want to make sure we've considered risks.\"",
          "\"What am I missing? Is there a perspective we haven't considered?\"",
        ],
      },
      {
        title: "Decision — Make the Call",
        icon: "✅",
        content: "Don't leave without a decision or clear next step.",
        bullets: [
          "\"So it sounds like we have two options: [A] or [B]. Let's vote.\"",
          "\"Are there any objections to [proposed decision]? [pause] Great, we're aligned.\"",
          "\"I'm going to make a decision call here: [decision]. If anyone has strong concerns, let's discuss offline.\"",
        ],
      },
      {
        title: "Closing — Action Items & Owners",
        icon: "📝",
        content: "Every meeting ends with WHO does WHAT by WHEN.",
        bullets: [
          "\"Let me summarize the action items: [item] → [owner] → [deadline].\"",
          "\"Are there any open questions we need to follow up on?\"",
          "\"Next meeting: [date/time]. Focus will be on [topic].\"",
          "\"I'll send meeting notes within [timeframe]. Please flag anything I missed.\"",
        ],
      },
    ],
    preparation: [
      "Send agenda 24 hours in advance with clear objectives",
      "Prepare data/updates relevant to each agenda item",
      "Pre-brief key stakeholders on controversial items",
      "Set up a shared document for real-time note-taking",
      "Prepare decision frameworks for items needing votes",
      "Block 5 minutes at the end for action item review",
    ],
    dosAndDonts: {
      dos: [
        "Start and end on time — respect people's schedules",
        "Assign a note-taker (rotate each meeting)",
        "Call on quiet participants directly",
        "Park off-topic discussions in a 'parking lot'",
        "Send written action items within 1 hour",
      ],
      donts: [
        "Don't let one person dominate the conversation",
        "Avoid rehashing decisions already made",
        "Don't schedule a meeting if an email would suffice",
        "Never leave without clear action items and owners",
        "Don't go over time — people will stop paying attention",
      ],
    },
    keyPhrases: [
      "\"Let's stay focused on [topic]...\"",
      "\"[Name], what's your take on this?\"",
      "\"Let's take this offline...\"",
      "\"So what I'm hearing is...\"",
      "\"Who owns this action item, and by when?\"",
    ],
    duration: "30-60 minutes",
  };
}

function generateSpeakerScript(ctx: ExtractedContext, rawContext: string): Omit<GeneratedScript, "role" | "context"> {
  return {
    sections: [
      {
        title: "Opening — Connect Instantly",
        icon: "👋",
        content: `Start with warmth and genuine emotion${rawContext ? ` about ${rawContext.split(",").slice(0, 2).join(" and")}` : ""}.`,
        bullets: [
          "\"For those who don't know me, I'm [name], and [relationship to the honoree/event].\"",
          "\"When I was asked to speak today, my first thought was [honest reaction].\"",
          "\"I've known [person] for [time], and if there's one thing I can tell you, it's this: [quality].\"",
          "\"There's a quote that reminds me of [person/occasion]: '[meaningful quote]'.\"",
        ],
      },
      {
        title: "Story — Make It Personal",
        icon: "📖",
        content: "Share a specific, vivid memory that illustrates their character.",
        bullets: [
          "\"I remember one time, [specific story with sensory details]. And that's when I knew [insight].\"",
          "\"What most people don't know about [person] is [endearing detail].\"",
          "\"There's a moment that perfectly captures who [person] is: [story].\"",
          "\"[Person] once told me, '[quote].' And that changed how I think about [topic].\"",
        ],
      },
      {
        title: "Tribute — Acknowledge Impact",
        icon: "⭐",
        content: "Connect their qualities to the impact they've had on others.",
        bullets: [
          "\"What makes [person] special isn't just [quality]. It's how they make everyone around them feel.\"",
          "\"I've watched [person] [action that shows character], and it inspired me to [personal growth].\"",
          "\"If you've been touched by [person], you know what I mean when I say [emotional statement].\"",
        ],
      },
      {
        title: "Humor — Balance Lightness",
        icon: "😄",
        content: "A well-placed joke humanizes and relaxes the room. Keep it kind.",
        bullets: [
          "\"Of course, [person] isn't perfect. [Funny but affectionate observation].\"",
          "\"I promised myself I wouldn't get emotional. [pause] I lied.\"",
          "\"If there's one thing [person] is terrible at, it's [endearing flaw].\"",
          "\"[Person] told me to keep this short. [pause] I'll try. [person], I said I'd try.\"",
        ],
      },
      {
        title: "Close — Raise a Glass",
        icon: "🥂",
        content: "End with hope, love, or a call to celebration.",
        bullets: [
          "\"So here's to [person] — [one-line tribute]. May [wish for the future].\"",
          "\"[Person], I am so proud of you. And I can't wait to see what comes next.\"",
          "\"Please join me in raising a glass to [person/event]. [Toast words].\"",
          "\"Thank you, [person], for being exactly who you are.\"",
        ],
      },
    ],
    preparation: [
      "Write the speech out fully, then practice until you can speak from bullet points",
      "Time yourself — aim for 3-5 minutes (shorter is almost always better)",
      "Practice in front of a mirror or record yourself",
      "Prepare for emotions — it's okay to pause and collect yourself",
      "Have a printed backup (notes on phone can fail)",
      "Test the microphone if using one",
      "Know the order of speakers if there are multiple",
    ],
    dosAndDonts: {
      dos: [
        "Be authentic — vulnerability is more powerful than polish",
        "Use specific stories, not generic compliments",
        "Speak slowly — nervousness makes you speed up",
        "Make eye contact with the honoree and the audience",
        "End on a high note with a clear toast or wish",
      ],
      donts: [
        "Don't make it about you — the focus is the honoree",
        "Avoid inside jokes that exclude most of the audience",
        "Don't read word-for-word from a script",
        "Never bring up genuinely embarrassing or hurtful stories",
        "Don't go over time — leave them wanting more",
      ],
    },
    keyPhrases: [
      "\"I'll never forget the time...\"",
      "\"What I admire most about [person] is...\"",
      "\"If there's one thing I want you to know...\"",
      "\"[Person], you are [tribute].\"",
      "\"Here's to [person] — [toast].\"",
    ],
    duration: "3-7 minutes",
  };
}

// ─── Main Generator ──────────────────────────────────────────────────

const GENERATORS: Record<ScriptRole, (ctx: ExtractedContext, raw: string) => Omit<GeneratedScript, "role" | "context">> = {
  interviewer: generateInterviewerScript,
  interviewee: generateIntervieweeScript,
  coach: generateCoachScript,
  presenter: generatePresenterScript,
  negotiator: generateNegotiatorScript,
  sales: generateSalesScript,
  meeting_facilitator: generateMeetingScript,
  speaker: generateSpeakerScript,
};

export function generateScript(role: ScriptRole, context: string): GeneratedScript | null {
  if (!context || context.trim().length < 5) return null;

  const extracted = extractContext(context);
  const generator = GENERATORS[role];
  if (!generator) return null;

  const result = generator(extracted, context.trim());

  return {
    role,
    context: context.trim(),
    ...result,
  };
}
