import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}

          <Link
            to="/"
            className="text-2xl font-bold tracking-tight"
          >
            Quant<span className="text-blue-500">Nova</span>
          </Link>


          {/* Desktop Navigation */}

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">

            <a
              href="#features"
              className="hover:text-white transition"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="hover:text-white transition"
            >
              How It Works
            </a>

            <a
              href="#about"
              className="hover:text-white transition"
            >
              About
            </a>

          </div>


          {/* Auth Buttons */}

          <div className="flex items-center gap-3">

            <Link
              to="/login"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition"
            >
              Get Started
            </Link>

          </div>

        </div>

      </nav>


      {/* ================================
          HERO
      ================================= */}

      <section className="relative pt-36 pb-24 px-6 overflow-hidden">

        {/* Background Glow */}

        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />


        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* Hero Text */}

          <div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">

              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />

              AI-Powered Trading Platform

            </div>


            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">

              Trade Smarter.
              <br />

              <span className="text-blue-500">
                Test Before
              </span>

              <br />

              You Trade.

            </h1>


            <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">

              Build trading strategies, analyze market data,
              backtest your ideas, and practice trading with
              virtual capital — all in one platform.

            </p>


            {/* Buttons */}

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                to="/register"
                className="px-7 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold transition shadow-lg shadow-blue-600/20"
              >
                Start Trading Free →
              </Link>

              <a
                href="#features"
                className="px-7 py-3.5 rounded-lg border border-slate-700 hover:bg-slate-900 font-semibold transition"
              >
                Explore Features
              </a>

            </div>


            {/* Small Stats */}

            <div className="mt-10 flex flex-wrap gap-8">

              <div>
                <p className="text-2xl font-bold">
                  ₹1L
                </p>

                <p className="text-sm text-slate-500">
                  Virtual Capital
                </p>
              </div>


              <div>
                <p className="text-2xl font-bold">
                  100%
                </p>

                <p className="text-sm text-slate-500">
                  Risk-Free Practice
                </p>
              </div>


              <div>
                <p className="text-2xl font-bold">
                  24/7
                </p>

                <p className="text-sm text-slate-500">
                  Strategy Testing
                </p>
              </div>

            </div>

          </div>


          {/* ================================
              DASHBOARD PREVIEW
          ================================= */}

          <div className="relative">

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">

              {/* Header */}

              <div className="flex items-center justify-between mb-6">

                <div>

                  <p className="text-xs text-slate-500">
                    PORTFOLIO
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    ₹1,04,250
                  </p>

                </div>

                <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm">
                  +4.25%
                </div>

              </div>


              {/* Chart */}

              <div className="h-48 rounded-xl bg-slate-950 border border-slate-800 p-4">

                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >

                  <polyline
                    points="0,160 50,145 100,150 150,120 200,130 250,90 300,105 350,70 400,85 450,45 500,60 550,25 600,40"
                    fill="none"
                    stroke="currentColor"
                    className="text-blue-500"
                    strokeWidth="4"
                  />

                </svg>

              </div>


              {/* Market Cards */}

              <div className="grid grid-cols-2 gap-3 mt-4">

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-500">
                    TCS.NS
                  </p>

                  <p className="text-lg font-semibold mt-1">
                    ₹3,421.50
                  </p>

                  <p className="text-sm text-green-400 mt-1">
                    +1.24%
                  </p>

                </div>


                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-500">
                    BHEL.NS
                  </p>

                  <p className="text-lg font-semibold mt-1">
                    ₹433.95
                  </p>

                  <p className="text-sm text-green-400 mt-1">
                    +2.18%
                  </p>

                </div>

              </div>


              {/* Strategy */}

              <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-500">
                    STRATEGY SIGNAL
                  </p>

                  <p className="font-semibold mt-1">
                    SMA / EMA Trend
                  </p>

                </div>

                <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm font-semibold">
                  BUY
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================================
          FEATURES
      ================================= */}

      <section
        id="features"
        className="py-24 px-6 border-t border-slate-900"
      >

        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto">

            <p className="text-blue-500 text-sm font-semibold uppercase tracking-wider">
              Powerful Tools
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Everything You Need to Trade Smarter
            </h2>

            <p className="text-slate-400 mt-4">
              From strategy creation to paper trading,
              QuantNova gives you the tools to test your ideas.
            </p>

          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">


            {/* Feature 1 */}

            <FeatureCard
              icon="📊"
              title="Market Analysis"
              description="Analyze historical market data and monitor stock price movements."
            />


            {/* Feature 2 */}

            <FeatureCard
              icon="⚙️"
              title="Strategy Builder"
              description="Create and configure trading strategies using technical indicators."
            />


            {/* Feature 3 */}

            <FeatureCard
              icon="🧪"
              title="Backtesting"
              description="Test your trading ideas against historical market data."
            />


            {/* Feature 4 */}

            <FeatureCard
              icon="💰"
              title="Paper Trading"
              description="Practice your strategies with ₹1,00,000 virtual trading capital."
            />

          </div>

        </div>

      </section>


      {/* ================================
          HOW IT WORKS
      ================================= */}

      <section
        id="how-it-works"
        className="py-24 px-6 bg-slate-900/40 border-y border-slate-900"
      >

        <div className="max-w-6xl mx-auto">

          <div className="text-center">

            <p className="text-blue-500 text-sm font-semibold uppercase tracking-wider">
              Simple Process
            </p>

            <h2 className="text-4xl font-bold mt-3">
              From Idea to Strategy
            </h2>

          </div>


          <div className="grid md:grid-cols-4 gap-6 mt-14">

            <Step
              number="01"
              title="Create Strategy"
              text="Choose a stock and configure your strategy."
            />

            <Step
              number="02"
              title="Analyze Market"
              text="Study historical market data and indicators."
            />

            <Step
              number="03"
              title="Backtest"
              text="Evaluate your strategy against historical data."
            />

            <Step
              number="04"
              title="Paper Trade"
              text="Execute simulated trades without risking real money."
            />

          </div>

        </div>

      </section>


      {/* ================================
          ABOUT
      ================================= */}

      <section
        id="about"
        className="py-24 px-6"
      >

        <div className="max-w-5xl mx-auto text-center">

          <p className="text-blue-500 text-sm font-semibold uppercase tracking-wider">
            About QuantNova
          </p>

          <h2 className="text-4xl font-bold mt-3">
            Learn. Test. Improve. Trade.
          </h2>

          <p className="text-slate-400 text-lg leading-relaxed mt-6 max-w-3xl mx-auto">

            QuantNova is designed to help traders experiment with
            systematic trading strategies before putting real capital
            at risk. Build strategies, analyze market data, backtest
            your ideas and practice through paper trading.

          </p>

        </div>

      </section>


      {/* ================================
          CTA
      ================================= */}

      <section className="px-6 pb-24">

        <div className="max-w-5xl mx-auto rounded-3xl bg-blue-600 p-10 md:p-16 text-center">

          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Test Your Strategy?
          </h2>

          <p className="text-blue-100 mt-4 text-lg">
            Start with ₹1,00,000 virtual capital.
            No real money required.
          </p>

          <Link
            to="/register"
            className="inline-block mt-8 px-8 py-4 bg-white text-blue-700 rounded-lg font-bold hover:bg-slate-100 transition"
          >
            Create Your Free Account →
          </Link>

        </div>

      </section>


      {/* ================================
          FOOTER
      ================================= */}

      <footer className="border-t border-slate-800 py-10 px-6">

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">

          <div>

            <p className="text-xl font-bold">
              Quant<span className="text-blue-500">
                Nova
              </span>
            </p>

            <p className="text-sm text-slate-500 mt-2">
              AI-powered trading and strategy platform.
            </p>

          </div>


          <div className="flex gap-6 text-sm text-slate-500">

            <a
              href="#features"
              className="hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="hover:text-white"
            >
              How It Works
            </a>

            <Link
              to="/login"
              className="hover:text-white"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="hover:text-white"
            >
              Register
            </Link>

          </div>

        </div>


        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 text-sm text-slate-600 text-center">

          © 2026 QuantNova. All rights reserved.

        </div>

      </footer>

    </div>
  );
}


/* ==========================================
   FEATURE CARD
========================================== */

function FeatureCard({
  icon,
  title,
  description,
}) {

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/40 hover:-translate-y-1 transition duration-300">

      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mt-5">
        {title}
      </h3>

      <p className="text-slate-400 mt-3 leading-relaxed">
        {description}
      </p>

    </div>
  );
}


/* ==========================================
   STEP
========================================== */

function Step({
  number,
  title,
  text,
}) {

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6">

      <span className="text-blue-500 text-sm font-bold">
        {number}
      </span>

      <h3 className="text-xl font-semibold mt-4">
        {title}
      </h3>

      <p className="text-slate-400 mt-3 leading-relaxed">
        {text}
      </p>

    </div>
  );
}