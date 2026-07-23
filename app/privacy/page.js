export const metadata = {
  title: 'Privacy Policy | Pokenzo',
  description: 'How Pokenzo collects, uses, and protects your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-20 pb-16">
      <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-[#8A8C9C]">Last updated: July 22, 2026</p>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">1. Introduction</h2>
          <p className="text-[#C7C9D9]">
            Pokenzo ("we", "us", "our") operates pokenzo.com, a price comparison and community platform for Pokémon Trading Card Game collectors and Pokémon GO players. This policy explains what information we collect, how we use it, and your rights regarding your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">2. Information We Collect</h2>
          <p className="text-[#C7C9D9] mb-2">If you create an account, we collect:</p>
          <ul className="list-disc list-inside text-[#C7C9D9] space-y-1">
            <li>Email address (for full accounts)</li>
            <li>Username and any profile information you choose to add (Pokémon GO friend code, trainer level, avatar selection)</li>
            <li>Content you post (trade offers, chat messages, community posts, images you upload)</li>
          </ul>
          <p className="text-[#C7C9D9] mt-2">
            We also use standard analytics (Vercel Analytics) to understand site usage. This does not identify you personally.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-[#C7C9D9] space-y-1">
            <li>To provide core features: price tracking, trading, raid coordination, and community chat</li>
            <li>To send account-related emails (confirmation, password reset)</li>
            <li>To moderate content and keep the platform safe (including automated image screening for uploaded photos)</li>
          </ul>
          <p className="text-[#C7C9D9] mt-2">We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">4. Third-Party Services</h2>
          <p className="text-[#C7C9D9] mb-2">We use the following third-party services to operate Pokenzo:</p>
          <ul className="list-disc list-inside text-[#C7C9D9] space-y-1">
            <li><strong>Supabase</strong> - database, authentication, and file storage</li>
            <li><strong>Vercel</strong> - website hosting and analytics</li>
            <li><strong>Resend</strong> - transactional emails</li>
            <li><strong>Sightengine</strong> - automated moderation of uploaded images</li>
            <li><strong>PokeAPI / Pokémon Showdown</strong> - Pokémon and trainer sprite images</li>
            <li><strong>Discord</strong> - our community server is hosted on Discord. If you join, your activity there is governed by Discord's own privacy policy and terms, not Pokenzo's.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">5. Cookies</h2>
          <p className="text-[#C7C9D9]">
            We use essential cookies/local storage to keep you logged in. We may use analytics cookies to understand site traffic. We do not use cookies for third-party advertising tracking beyond what is disclosed here.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">6. Your Rights</h2>
          <p className="text-[#C7C9D9]">
            You can view and edit your profile information at any time from your account settings. You can permanently delete your account and all associated data (trade offers, raid history, community posts) directly from your profile page under "Edit profile" → "Danger zone". This action is immediate and cannot be undone.
         </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">7. Children's Privacy</h2>
          <p className="text-[#C7C9D9]">
            Pokenzo is not directed at children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">8. Changes to This Policy</h2>
          <p className="text-[#C7C9D9]">
            We may update this policy from time to time. Continued use of Pokenzo after changes means you accept the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">9. Contact</h2>
          <p className="text-[#C7C9D9]">
            Questions about this policy? Reach out via our Discord server or through the contact info on pokenzo.com.
          </p>
        </section>
      </div>
    </main>
  )
}