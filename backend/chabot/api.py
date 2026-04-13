from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
from typing import Optional, Any
from dotenv import load_dotenv
import os
import re
import requests
from fastapi import APIRouter
router = APIRouter()

# load_dotenv(dotenv_path=".env")

# app = FastAPI()

def fetch_loan_products():
    try:
        BASE_URL = os.getenv("BASE_URL")
        res = requests.get(f"{BASE_URL}/loan/products")
        return res.json().get("products", [])
    except Exception as e:
        print("Loan Fetch Error:", e)
        return []

# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

class ChatRequest(BaseModel):
    message: str
    session_id: str
    selected_loan: Optional[Any] = None
    username: Optional[str] = None


sessions = {}


def extract_income(text):
    match = re.search(r"(income\s*is\s*|salary\s*is\s*)(\d+)", text.lower())
    return int(match.group(2)) if match else None

def format_indian_currency(amount):
    """Format amount in Indian currency style (e.g., 1000000 -> 10L or ₹10,00,000)"""
    try:
        amount = int(amount)
    except (ValueError, TypeError):
        return "N/A"
    
    if amount >= 10000000:  # >= 1 Crore
        crores = amount / 10000000
        if crores == int(crores):
            return f"₹{int(crores)}Cr"
        return f"₹{crores:.1f}Cr"
    elif amount >= 100000:  # >= 1 Lakh
        lakhs = amount / 100000
        if lakhs == int(lakhs):
            return f"₹{int(lakhs)}L"
        return f"₹{lakhs:.1f}L"
    else:
        return f"₹{amount:,}"


def format_loan_scheme_overview(loan_products):
    """Format all available loan schemes in a readable format for the user"""
    if not loan_products:
        return "No loan products available"
    
    overview = "📊 **Available Loan Schemes:**\n\n"
    for i, product in enumerate(loan_products, 1):
        max_amount = format_indian_currency(product.get('max_amount', 'N/A'))
        min_rate = product.get('interest_rate', product.get('min_rate', 'N/A'))
        max_tenure = product.get('max_tenure_months', 'N/A')
        
        overview += f"{i}. **{product.get('name', 'Loan')}** ({product.get('loan_type', 'N/A')})\n"
        overview += f"   • Amount: Up to {max_amount}\n"
        overview += f"   • Interest Rate: {min_rate}% p.a.\n"
        overview += f"   • Tenure: Up to {max_tenure} months\n"
        overview += f"   • Min Income: ₹{product.get('residual_income', 25000):,}/month\n\n"
    
    return overview


@router.post("/chat")
def chat(req: ChatRequest):

    session_id = req.session_id
    selected_loan = req.selected_loan
    username = req.username or "there"
    loan_products = fetch_loan_products()

    if session_id not in sessions:
        sessions[session_id] = {
            "messages": [],
            "user_data": {"name": username},
            "selected_loan": selected_loan,
            "step": "loan_explanation" if selected_loan else "show_loans",
            "loan_products": loan_products
        }
        
        
        if selected_loan:
            # User came from loan card - show specific loan details
            features_str = ", ".join(selected_loan.get('features', ['N/A'])[:3]) if selected_loan.get('features') else 'N/A'
            desc = selected_loan.get('description', 'A great loan product')
            all_features = ", ".join(selected_loan.get('features', [])) if selected_loan.get('features') else 'N/A'
            documents_str = ", ".join(selected_loan.get('documents_needed', [])) if selected_loan.get('documents_needed') else 'N/A'
            
            greeting = f"""👋 **Welcome, {username}!** I'm CredoAI, your intelligent loan agent.

I see you're interested in our **{selected_loan.get('name', 'loan')}**. Great choice! Let me walk you through exactly what this loan can do for you and how it might fit your needs."""
            
            # Format loan amount in Indian currency
            formatted_max_amount = format_indian_currency(selected_loan.get('max_amount', 'N/A'))
            
            loan_details = f"""SELECTED LOAN FOR DETAILED EXPLANATION:
Loan Name: {selected_loan.get('name', 'loan')}
Type: {selected_loan.get('loan_type', 'N/A')}
Interest Rate: {selected_loan.get('interest_rate', selected_loan.get('min_rate', 'N/A'))}%
Max Amount: {formatted_max_amount}
Tenure: {selected_loan.get('min_tenure_months', 'N/A')}-{selected_loan.get('max_tenure_months', 'N/A')} months
Min Income Required: ₹{selected_loan.get('residual_income', 'N/A'):,}/month
Processing Fee: {selected_loan.get('processing_fee_pct', 'N/A')}%
Eligibility: {selected_loan.get('eligibility_notes', 'Please contact us for details')}
Description: {desc}
Features: {all_features}
Documents needed: {documents_str}"""
            
            system_prompt_explanation = f"""You are CredoAI, an intelligent and genuinely helpful Loan Agent. You're speaking with {username} about the {selected_loan.get('name', 'loan')} they've selected.

{loan_details}

YOUR PERSONALITY & APPROACH:
- Conversational and warm - like talking to a knowledgeable loan agent
- Genuinely interested in helping {username} make the best decision
- Professional but never stiff or corporate
- Use natural language with contractions (I'm, we've, can't, etc.)
- Show real understanding of their financial situation
- Patient and never pushy
- Confident in your knowledge but humble in your approach

CRITICAL INSTRUCTIONS:
1. ONLY discuss the {selected_loan.get('name', 'loan')} - that's what {username} selected
2. Do NOT mention other loans unless {username} specifically asks about them
3. ALL information comes from the provided loan details only
4. Use {username}'s name occasionally to build connection
5. Do NOT ask for sensitive info like PAN, Aadhaar, SSN yet

CONVERSATION TONE EXAMPLES:
Instead of: "The loan provides unsecured credit up to ₹25,00,000"
Say: "So here's what's great about this loan - you don't need to pledge any assets. You can borrow up to 25 lakhs, and we typically process it pretty quickly"

Instead of: "Processing timeline is 3-5 business days"
Say: "From the time you submit everything, we usually have approval within 3-5 days. Many applicants are surprised by how fast we move"

Instead of: "Applicants must provide the following documents"
Say: "Here's what we need from you - and honestly, it's pretty straightforward. Most people already have these"

FOLLOW-UP QUESTIONS - Feel natural:
- "So tell me, what's driving your interest in this particular loan?"
- "Do you have a sense of the amount you'd want to borrow?"
- "Have you taken a loan before, or is this your first time?"
- "Any specific concerns or questions on your mind?"
- "What timeline are you working with?"

HANDLING OBJECTIONS:
- If hesitant: "I totally get it - loans can feel overwhelming. But I promise we'll make this simple"
- If comparing: "I respect that you're checking other options. What matters is finding the right fit for YOUR situation"
- If concerned about docs: "I hear this from a lot of people. The documents are pretty standard - nothing crazy"
- If worried about rates: "Your rate depends on your profile. The good news is we're competitive and transparent"

BE LIKE A REAL AGENT:
- Listen carefully to what they're saying (and not saying)
- Answer their real question, not just the surface question
- Offer insights from experience: "What I've seen work well for people in your situation..."
- Acknowledge their concerns genuinely
- Guide them forward without pressure
- Make them feel heard and understood

REMEMBER: {username} is making an important decision. They're trusting you. Be worthy of that trust."""
            
            detailed_explanation = ""
            try:
                print(f"📝 Generating AI explanation for {selected_loan.get('name', 'loan')}...")
                explanation_response = client.chat.completions.create(
                    model="meta-llama/llama-3-8b-instruct",
                    messages=[
                        {"role": "system", "content": system_prompt_explanation},
                        {"role": "user", "content": f"Tell me all about the {selected_loan.get('name', 'loan')} and help me understand if it's right for me."}
                    ],
                    temperature=0.7,
                    max_tokens=1500
                )
                detailed_explanation = explanation_response.choices[0].message.content
                print(f"✅ AI Explanation generated successfully: {len(detailed_explanation)} characters")
            except Exception as e:
                print(f"❌ AI explanation error: {str(e)}")
                # Fallback explanation with structured content - use ONLY selected loan data
                fallback_type = selected_loan.get('loan_type', 'loan')
                fallback_desc = selected_loan.get('description', f'This is our {selected_loan.get("name", "loan")} offering.')
                fallback_formatted_amount = format_indian_currency(selected_loan.get('max_amount', 'N/A'))
                fallback_rate = selected_loan.get('interest_rate', selected_loan.get('min_rate', 'N/A'))
                
                detailed_explanation = f"""Hey {username}! 👋 

I'm so glad you're interested in our **{selected_loan.get('name', 'loan')}**. Let me tell you why this could be absolutely perfect for you.

## What is the {selected_loan.get('name', 'loan')}?

{fallback_desc} 

In simple terms - this is a {fallback_type} loan that's designed specifically with customers like you in mind. It's straightforward, transparent, and we've helped thousands of people through this exact product.

## Why I Love This Loan for You

Here's what makes this stand out:
{chr(10).join(['• **' + f.split(':')[0] + '** — ' + f if ':' in f else '• ' + f for f in selected_loan.get('features', ['Premium features available'])])}

These aren't just features on paper, {username} - these are genuine benefits that my past clients have really valued.

## The Numbers (The Important Stuff)

- **How much can you borrow?** Up to {fallback_formatted_amount}
- **Interest rate?** Starting at {fallback_rate}% per annum - and honestly, this is quite competitive
- **How long to repay?** You can spread it from {selected_loan.get('min_tenure_months', 'various')} months up to {selected_loan.get('max_tenure_months', 'flexible')} months - so you can tailor it to your budget
- **Processing fee?** {selected_loan.get('processing_fee_pct', 'N/A')}% of the loan amount

The great thing? These are not fixed numbers - depending on your profile, you might qualify for even better terms.

## Who is This Best For?

{selected_loan.get('eligibility_notes', 'We look at your overall financial profile, not just one number')}

Do you fit this picture? I'd love to hear a bit more about your situation.

## What Documents Will You Need?

Good news - it's pretty straightforward:
{chr(10).join(['📄 ' + doc for doc in selected_loan.get('documents_needed', ['Standard KYC documents'])])}

I know documentation can seem intimidating, but these are documents most people already have. We can guide you through every step.

## How Does This Work?

Here's the simple process:
1. **You tell us what you need** - share your goals and situation
2. **We assess your eligibility** - quick and transparent
3. **You submit minimal documents** - nothing crazy, I promise
4. **We verify and approve** - usually within 3-5 days
5. **Money hits your account** - fast and clean

## What Happens Next?

That depends on you, {username}! Here are your options:

👉 **Ask me questions** - Anything you want to know? Go ahead. No such thing as a "stupid question" in the financial world.

👉 **Want details on eligibility?** - Tell me about your situation (income, current obligations) and I can give you a clear sense of what you might qualify for

👉 **Ready to explore further?** - Great! We can start the process and I'll guide you every step of the way

Remember, {username} - I'm here to make this easy for you. My job is to make sure you get the right loan at the right terms. So what would be most helpful for you right now?"""
            
            # Store initial conversation with the explanation
            sessions[session_id]["messages"] = [
                {"role": "user", "content": f"Tell me about the {selected_loan.get('name', 'loan')}"},
                {"role": "assistant", "content": detailed_explanation}
            ]
            
            # Store loan details for follow-up context
            sessions[session_id]["loan_details"] = loan_details
            sessions[session_id]["selected_loan_name"] = selected_loan.get('name', 'loan')
            
            # Return ONLY the AI-generated explanation (it includes greeting already)
            print(f"✅ Returning initial response with explanation")
            return {
                "response": detailed_explanation,
                "extra": "",
                "action": None
            }
        else:
            # User hasn't selected a loan yet - show all schemes and guide them
            loan_schemes_overview = format_loan_scheme_overview(loan_products)
            
            greeting = f"""Hi {username}! 👋 I'm **CredoAI**, your intelligent loan agent. 

I'm here to understand what you need and guide you to the perfect loan for your situation. Think of me as your financial guide - I'm not here to push anything on you, just to help you make the right decision.

{loan_schemes_overview}

Let me get to know you a bit better:

💭 **Tell me:**
- What are you looking to do? (buying a home, car, education, business, etc.)
- Do you have a ballpark idea of how much you'd need?
- What's your approximate monthly income?
- Have you taken loans before?

Once I understand what you're working with, I can recommend exactly what'll work best for you. Sound good? 💪"""
            
            sessions[session_id]["messages"] = []
            sessions[session_id]["step"] = "show_loans"
            
            return {
                "response": greeting,
                "extra": "",
                "action": None
            }

    session = sessions[session_id]
    messages = session["messages"]
    data = session["user_data"]
    selected_loan = session.get("selected_loan") or selected_loan
    loan_products_context = session.get("loan_products", loan_products)

    user_input = req.message
    
    # Process user input
    if user_input.strip():
        print(f"📨 User input received: {user_input[:50]}...")
        messages.append({"role": "user", "content": user_input})

        # Extract income if mentioned
        income = extract_income(user_input)
        if income: 
            data["income"] = income

    # Build loan context for the response
    loan_context = ""
    if selected_loan:
        formatted_context_amount = format_indian_currency(selected_loan.get('max_amount', 'N/A'))
        loan_context = f"""

CONTEXT - USER SELECTED THIS LOAN: {selected_loan.get('name', 'loan')}
Loan Details: {selected_loan.get('loan_type', 'N/A')} | Interest Rate: {selected_loan.get('interest_rate', selected_loan.get('min_rate', 'N/A'))}% | Max Amount: {formatted_context_amount} | Tenure: {selected_loan.get('min_tenure_months', 'N/A')}-{selected_loan.get('max_tenure_months', 'N/A')} months
Features: {', '.join(selected_loan.get('features', []))}
Eligibility: {selected_loan.get('eligibility_notes', 'N/A')}"""
    
    # Use appropriate system prompt based on mode
    if session["step"] == "loan_explanation" and selected_loan:
        formatted_system_amount = format_indian_currency(selected_loan.get('max_amount', 'N/A'))
        system_prompt = f"""You are CredoAI, an intelligent loan agent having a conversation with {username} about their selected loan - the {selected_loan.get('name', 'loan')}.

SELECTED LOAN FOR THIS CONVERSATION:
Loan Name: {selected_loan.get('name', 'loan')}
Type: {selected_loan.get('loan_type', 'N/A')}
Interest Rate: {selected_loan.get('interest_rate', selected_loan.get('min_rate', 'N/A'))}%
Max Amount: {formatted_system_amount}
Tenure: {selected_loan.get('min_tenure_months', 'N/A')}-{selected_loan.get('max_tenure_months', 'N/A')} months
Min Monthly Income: ₹{selected_loan.get('residual_income', 'N/A'):,}
Processing Fee: {selected_loan.get('processing_fee_pct', 'N/A')}%
Eligibility: {selected_loan.get('eligibility_notes', 'N/A')}
Features: {', '.join(selected_loan.get('features', []))}
Documents Needed: {', '.join(selected_loan.get('documents_needed', []))}
Description: {selected_loan.get('description', 'N/A')}

CRITICAL RULES:
1. ONLY discuss the {selected_loan.get('name', 'loan')} - never mention other loans
2. If {username} asks about other loans, politely redirect: "Look, I'm really focused on making sure this {selected_loan.get('name', 'loan')} is the right fit for you first. We can explore other options later if you want, but let's nail this one down."
3. Use ONLY information from the database above - nothing generic or made up
4. Use {username}'s name naturally in the conversation
5. Never ask for sensitive information like PAN, Aadhaar, SSN at this stage

YOUR PERSONALITY:
- Conversational and helpful - like a real loan agent
- Show genuine interest in {username}'s situation
- Be warm but professional
- Use natural language with contractions
- Listen to what they're really asking (not just surface questions)
- Make them feel heard and understood
- Guide without being pushy

HOW TO RESPOND:
1. Understand the real question behind their words
2. Answer conversationally with specific examples
3. Use their context: "Based on what you've told me so far..."
4. Invite more discussion: "Does that make sense? Any other questions?"
5. Be proactive about common concerns

CONVERSATION STYLE:
- "So here's how this actually works in practice..."
- "What most people find helpful is..."
- "I totally understand why you'd ask that, but here's the thing..."
- "That's a good question - let me explain..."
- "Based on your situation, here's what I'd recommend..."

HANDLING SPECIFIC SCENARIOS:
- Timeline questions: "From submission to approval, we typically move within 3-5 days. I've seen it faster for ready applicants"
- Hesitation: "I get it - big financial decisions can feel overwhelming. But I promise we'll keep this straightforward"
- Concerns about approval: "Your rate and terms depend on your full profile. The good news is we're transparent throughout"
- Document worries: "The documents are pretty standard - nothing crazy. Most people have these already"

Remember: {username} is making an important decision and trusting you. Be worthy of that trust. Be their agent, their guide, their trusted source in this process."""
    else:
        # Not yet selected a loan - guide them
        loan_products_str = format_loan_scheme_overview(loan_products_context)
        system_prompt = f"""You are CredoAI, an intelligent loan agent having a conversation with {username} to help them find the perfect loan solution.

AVAILABLE LOANS FROM OUR DATABASE:
{loan_products_str}

YOUR PERSONALITY & APPROACH:
- Conversational and genuinely interested in {username}'s situation
- Like a real, experienced loan agent - listen, ask smart questions, guide thoughtfully
- Use natural language with contractions and warm tone
- Show expertise without being condescending or corporate
- Help them understand what they REALLY need (listen to the person, not just the question)
- Make recommendations from DATABASE LOANS ONLY
- Never pushy - you're their trusted advisor
- Use {username}'s name occasionally to build a real connection

CONVERSATION PATTERN:
1. Warmly greet and show genuine interest in WHY they're here
2. Ask clarifying questions to understand their complete situation:
   - "So what brings you here today? What are you looking to do?"
   - "Do you have a rough sense of how much you'd need?"
   - "What's your timeline looking like?"
   - "Have you taken loans before, or would this be your first?"
   - "Any existing obligations - family depending on your income, that sort of thing?"
   - "What's your monthly income range today?"
3. Based on what they share, recommend suitable loans from DATABASE ONLY
4. Explain WHY each one fits their situation specifically
5. Ask if they want to explore any loan deeper
6. Guide them to take next steps

CRITICAL RULES:
- ONLY recommend loans we actually have in the database
- NEVER invent products or features
- If they ask about a loan we don't have, say: "We don't currently have that, but let me tell you what we DO have that might work for you..."
- Use ONLY information from the database for each loan

TONE & LANGUAGE EXAMPLES:
"So here's my thought - based on what you've told me..." (not "Based on the criteria")
"I'm thinking this loan could work really well for you" (not "This loan offers")
"You'd typically need at least 25k monthly income" (not "Minimum monthly income requirement is")
"So the way it works is..." (not "The process is as follows")
"That's a really good question" (acknowledge their concern first)
"I hear you - a lot of people think about this" (empathy before explanation)
"Don't worry, we'll make this straightforward" (reassure and guide)

WHEN THEY ASK QUESTIONS:
- Listen to the REAL question (sometimes it's about confidence, not facts)
- Answer warmly with specific examples from their situation
- Use their context: "Based on what you've mentioned about your income..."
- Don't just recite features - explain WHY it matters to THEM
- Invite more conversation: "Does that make sense? Anything else on your mind?"

HANDLING OBJECTIONS:
- Hesitation: "I totally understand - finances can feel overwhelming. But I promise we'll walk through this together"
- Comparing options: "I get that you're checking around. What matters is finding the RIGHT option for YOUR situation"
- Worried about eligibility: "Let's talk through your situation. I can give you a pretty good idea"
- Concerned about documents: "Yes, we need some docs, but it's pretty standard stuff. Most people already have these"
- Worried about rates: "Your final rate depends on your full profile. The good news is we're upfront and fair about it"

REMEMBER: {username} is making an important financial decision. They might be nervous or uncertain. Your job is to be their trusted guide - patient, knowledgeable, and genuinely interested in helping them find the RIGHT solution, not just any solution."""

    print(f"🤖 Preparing AI response...")
    print(f"   Username: {username}")
    print(f"   Session step: {session['step']}")
    print(f"   Messages in history: {len(messages)}")
    print(f"   Selected loan: {selected_loan.get('name', 'loan') if selected_loan else 'None'}")
    
    response = client.chat.completions.create(
        model="meta-llama/llama-3-8b-instruct",
        messages=[
            {"role": "system", "content": system_prompt},
            *messages
        ]
    )

    bot_reply = response.choices[0].message.content
    messages.append({"role": "assistant", "content": bot_reply})
    
    # Check if user is switching to a different loan
    user_input_lower = user_input.lower() if user_input else ""
    
    # If currently in loan explanation and user asks about other loans, note it but maintain current focus
    if selected_loan and "other loan" in user_input_lower or "different loan" in user_input_lower or "alternate" in user_input_lower:
        session["asking_about_alternatives"] = True
    
    print(f"✅ AI response generated: {len(bot_reply)} characters")

    extra = ""

    return {
        "response": bot_reply,
        "extra": extra
    }