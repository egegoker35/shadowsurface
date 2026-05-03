export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-slate-400 mb-8">Questions about pricing, features, or enterprise deals? Reach out.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-4">
          <div><span className="text-slate-400">Email:</span> <a href="mailto:egegoker35@gmail.com" className="text-emerald-400 hover:underline">egegoker35@gmail.com</a></div>
          <div><span className="text-slate-400">Sales:</span> <a href="mailto:egegoker35@gmail.com" className="text-emerald-400 hover:underline">egegoker35@gmail.com</a></div>
          <div><span className="text-slate-400">Security:</span> <a href="mailto:egegoker35@gmail.com" className="text-emerald-400 hover:underline">egegoker35@gmail.com</a></div>
          <hr className="border-slate-800" />
          <p className="text-slate-500 text-sm">Enterprise customers get a dedicated Slack channel and phone support.</p>
        </div>
      </div>
    </div>
  );
}
