export const metadata = {
  title: 'Terms of Service | Pokenzo',
  description: 'Terms and conditions for using Pokenzo.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-20 pb-16">
      <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-[#8A8C9C]">Last updated: July 22, 2026</p>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">1. Acceptance of Terms</h2>
          <p className="text-[#C7C9D9]">
            By using pokenzo.com, you agree to these terms. If you don't agree, please don't use the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">2. What Pokenzo Is</h2>
          <p className="text-[#C7C9D9]">
            Pokenzo is an independent, fan-made price comparison and community platform for Pokémon Trading Card Game products and Pokémon GO players. We are not affiliated with, endorsed by, or sponsored by Nintendo, Niantic, GAME FREAK, or The Pokémon Company.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">3. Price Accuracy</h2>
          <p className="text-[#C7C9D9]">
            We track prices and stock automatically from third-party retailers. While we aim for accuracy, prices and availability can change quickly and we cannot guarantee the information shown is always current. Always verify price and stock on the retailer's own site before purchasing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">4. User Accounts</h2>
          <p className="text-[#C7C9D9]">
            You are responsible for keeping your account credentials secure. You must provide accurate information and are responsible for content you post, including trade offers, chat messages, and images.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">5. Acceptable Use</h2>
          <p className="text-[#C7C9D9] mb-2">You agree not to:</p>
          <ul className="list-disc list-inside text-[#C7C9D9] space-y-1">
            <li>Post illegal, harmful, or inappropriate content, including sexual content involving minors, harassment, or hate speech</li>
            <li>Share links to external sites in community chat, trade offers, or messages</li>
            <li>Attempt to disrupt, hack, or abuse the platform or other users</li>
            <li>Use another person's account without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">6. Trading and Raids</h2>
          <p className="text-[#C7C9D9]">
            Pokenzo only facilitates coordination (chat, scheduling, friend code sharing) for Pokémon GO trades and raids. Actual trades and raid battles happen within the Pokémon GO app itself, subject to Niantic's own terms. We are not responsible for the outcome of any trade or raid arranged through our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">7. Content Moderation</h2>
          <p className="text-[#C7C9D9]">
            We use automated moderation and user reporting to remove inappropriate content. We reserve the right to remove content or suspend accounts that violate these terms, at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">8. Limitation of Liability</h2>
          <p className="text-[#C7C9D9]">
            Pokenzo is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the site, including inaccurate pricing information, disputes with other users, or issues arising from trades/raids arranged through the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">9. Changes to These Terms</h2>
          <p className="text-[#C7C9D9]">
            We may update these terms from time to time. Continued use of Pokenzo after changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-[#E8A33D]">10. Contact</h2>
          <p className="text-[#C7C9D9]">
            Questions about these terms? Reach out via our Discord server or through the contact info on pokenzo.com.
          </p>
        </section>
      </div>
    </main>
  )
}