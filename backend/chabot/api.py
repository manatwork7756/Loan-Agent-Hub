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
            
            greeting = f"""👋 **Welcome, {username}!** I'm CredoAI, your AI Loan Advisor.

I see you're interested in our **{selected_loan.get('name', 'loan')}**. Great choice! Let me explain why this could be perfect for you and answer all your questions."""
            
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
            
            system_prompt_explanation = f"""You are CredoAI, a friendly and professional AI Loan Advisor for a fintech platform in India. 
You are speaking with {username}.

{loan_details}

CRITICAL INSTRUCTIONS:
1. You MUST ONLY discuss the {selected_loan.get('name', 'loan')} - this is the specific loan the user selected
2. Do NOT mention, recommend, or compare with any other loan products
3. Do NOT discuss generic loans or make up loan details
4. ALL information you provide must come from the loan details above
5. Only discuss the features, rates, tenure, eligibility, and documents listed above
6. Address {username} by their name warmly and professionally
7. Do NOT ask for personal information like PAN, Aadhaar, SSN, or ID numbers
8. If {username} asks about other loans, politely decline and offer to discuss THIS loan in detail

TASK: Provide a comprehensive, warm explanation of ONLY the {selected_loan.get('name', 'loan')} to {username}.

Cover these points using ONLY the information provided:
1. Warm greeting acknowledging they selected THIS loan
2. Why this specific loan is beneficial 
3. Key advantages and features (from the list above)
4. Who it's best suited for (based on eligibility criteria)
5. Important terms, conditions and eligibility criteria
6. Required documents (list what's needed)
7. How the application process works
8. Invite questions about this specific loan

Be conversational, warm, professional and encouraging. Use Indian currency (₹). 
IMPORTANT: Use ONLY the loan details provided - do NOT add information about other loans."""
            
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
                
                detailed_explanation = f"""## {selected_loan.get('name', 'Loan')} - Detailed Overview

👋 **Welcome, {username}!** Thanks for choosing our {selected_loan.get('name', 'loan')}. I'm excited to help you!

### What is this loan?
{fallback_desc}

### 💪 Key Advantages & Features:
{chr(10).join(['• ' + f for f in selected_loan.get('features', ['Premium features available'])])}

### 💰 Loan Terms:
• **Interest Rate:** {fallback_rate}% per annum
• **Loan Amount:** Up to {fallback_formatted_amount}
• **Tenure:** {selected_loan.get('min_tenure_months', 'N/A')} to {selected_loan.get('max_tenure_months', 'N/A')} months
• **Min Monthly Income:** ₹{selected_loan.get('residual_income', 'N/A'):,}
• **Processing Fee:** {selected_loan.get('processing_fee_pct', 'N/A')}%

### 👥 Who Should Apply?
{selected_loan.get('eligibility_notes', 'This loan is designed for eligible individuals. Please check the criteria above.')}

### 📋 Documents Required:
{chr(10).join(['• ' + doc for doc in selected_loan.get('documents_needed', ['Standard KYC documents'])])}

### ✨ Why This Loan?
This {fallback_type} loan is designed to provide you with quick access to funds while maintaining competitive rates and flexible tenure options. It's perfect if {fallback_desc.lower()}

### 🚀 Next Steps:
Feel free to ask me any questions about this loan! I'm here to help you understand every aspect and guide you through the application process."""
            
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
            
            greeting = f"""👋 **Welcome, {username}!** I'm CredoAI, your AI Loan Advisor. 🚀

I'm here to help you find the perfect loan based on your needs and guide you through the entire application process.

{loan_schemes_overview}

**Which loan interests you?** Just tell me:
- What you need the money for (buying a home, car, education, starting a business, etc.)
- Approximately how much you need
- Your current monthly income

I'll recommend the perfect loan scheme for you and explain everything in detail! 💬"""
            
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
        system_prompt = f"""You are CredoAI, a friendly and professional AI Loan Advisor for a fintech platform in India.
You are speaking with {username}.

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

CRITICAL INSTRUCTIONS FOR THIS CONVERSATION:
1. ONLY discuss the {selected_loan.get('name', 'loan')} - this is the loan {username} selected
2. Do NOT mention, recommend, or compare with any other loan products
3. Do NOT suggest alternative loans even if user asks
4. ALL answers must be about the {selected_loan.get('name', 'loan')} ONLY
5. If {username} asks about other loans, politely decline and redirect to the selected loan
6. Use ONLY the loan details provided above - do NOT add generic information about other loan types
7. Address {username} by their name warmly and professionally
8. Do NOT ask for personal information like PAN, Aadhaar, SSN, or ID numbers
9. Provide follow-up guidance on eligibility, documents, and application process for THIS loan

RESPONSE GUIDELINES:
- Be warm, conversational, and professional
- Provide detailed, accurate answers about the selected loan only
- Answer questions about features, rates, tenure, eligibility, documents, and process
- Use Indian currency format (₹)
- Give practical, actionable advice specific to this loan
- Encourage {username} to ask questions about THIS loan
- If {username} wants to apply, guide them to next steps
- Remember {username}'s name and use it appropriately"""
    else:
        # Not yet selected a loan - guide them
        loan_products_str = format_loan_scheme_overview(loan_products_context)
        system_prompt = f"""You are CredoAI, a friendly and professional AI Loan Advisor for a fintech platform in India.
You are speaking with {username}.

AVAILABLE LOAN PRODUCTS IN OUR DATABASE:
{loan_products_str}

INSTRUCTIONS FOR {username}:
- Be warm and conversational, like a helpful personal loan advisor
- Address {username} by their name warmly and professionally
- Help {username} explore and understand ONLY loan products FROM THE DATABASE ABOVE
- Only discuss loans that exist in the available products list
- Never make up loans or discuss products not in the database
- Answer questions about features, rates, eligibility, documents, tenure
- Use Indian currency format (₹)
- Based on {username}'s needs (home purchase, car, education, business, etc.), recommend suitable loans from the list
- Guide {username} to select ONE specific loan by asking:
  * What they need the money for
  * How much they need
  * Their approximate monthly income
  * Any existing loans/EMIs
- Do NOT ask for personal information like name, PAN, Aadhaar, SSN, or ID numbers
- Keep responses concise but helpful
- Once {username} indicates interest in a specific loan, provide detailed information about THAT loan only
- Always stay factual and use only information from the database"""

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