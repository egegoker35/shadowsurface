import Navbar from '@/components/Navbar';

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-extrabold mb-2 text-center">Contact Us</h1>
          <p className="text-slate-400 text-center mb-8">Questions about pricing, features, or enterprise deals? Reach out.</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            <div className="space-y-4 text-sm">
              <div><span className="text-slate-400">Email:</span> <a href="mailto:hello@shadowsurface.com" className="text-emerald-400 hover:underline">hello@shadowsurface.com</a></div>
              <div><span className="text-slate-400">Sales:</span> <a href="mailto:sales@shadowsurface.com" className="text-emerald-400 hover:underline">sales@shadowsurface.com</a></div>
              <div><span className="text-slate-400">Security:</span> <a href="mailto:security@shadowsurface.com" className="text-emerald-400 hover:underline">security@shadowsurface.com</a></div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-slate-400">Enterprise customers get a dedicated Slack channel and phone support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
