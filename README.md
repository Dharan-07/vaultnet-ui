# VaultNet UI

Hey folks! So, I built this little project called VaultNet UI because I got tired of AI models being locked away in silos. Imagine a place where anyone can upload their cool AI stuff, vote on it like Reddit, and even trade it on the blockchain. That's VaultNet – a decentralized marketplace for models and datasets, all wrapped in a snappy React frontend.

## What's the Big Idea?

VaultNet is my take on democratizing AI. No more gatekeepers – users get to:
- Hunt for models in a searchable marketplace
- Drop their own creations and datasets
- Cast votes to build trust scores (because who trusts unvoted models?)
- Hook up their crypto wallets for real on-chain magic
- Tweak their profiles and dashboards like it's their personal playground

Under the hood, it's blockchain for that sweet transparency, IPFS for storing files without Big Brother watching, and Supabase handling the backend grunt work.

## Tech Stack Under the Hood

- **Frontend**: React with TypeScript (because who wants runtime surprises?), Vite to make builds lightning-fast
- **Styling**: Tailwind CSS for quick designs + shadcn/ui for those polished components
- **Backend Vibes**: Supabase for the database (it's like Firebase but cooler), Firebase for auth, IPFS for decentralized file storage
- **Blockchain Stuff**: Web3.js to connect wallets and handle voting on-chain
- **Extras**: ESLint to keep the code clean, PostCSS for style magic

## Let's Get This Party Started

Wanna run it locally? Cool, grab Node.js first (nvm is your friend for versions).

1. **Grab the code**:
   ```bash
   git clone <your-repo-url>
   cd vaultnet-ui
   ```

2. **Install the goodies**:
   ```bash
   npm install
   # Or if you're team Bun:
   bun install
   ```

3. **Env setup time**:
   Whip up a `.env` file in the root. Toss in your Supabase URL, Firebase keys, and whatever else the code needs. Peek at the source for clues.

4. **Fire it up**:
   ```bash
   npm run dev
   ```
   Boom! Hit http://localhost:5173 and you're in the game.

## Shipping to Production

Ready to launch? Easy peasy:
```bash
npm run build
```
Your optimized files will be chilling in the `dist` folder. Deploy wherever floats your boat.

## How's It Organized?

- `src/components/`: All the reusable UI pieces, like Lego blocks
- `src/pages/`: The main screens – Dashboard, Marketplace, you name it
- `src/contexts/`: React contexts for handling auth and global state
- `src/lib/`: Handy utils and integrations (IPFS, web3, etc.)
- `supabase/`: Backend functions and database migrations

## Wanna Chip In?

Got a bug or a wild idea? Slam an issue or PR my way. Let's collaborate! Just keep things tidy, add some tests if you can, and we'll be golden.

## License Stuff

MIT license – go wild, fork it, make it your own. No strings attached.

---

Made with love, endless debugging sessions, and way too much coffee. If this sparks joy, give it a star on GitHub!
