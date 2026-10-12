function Header() {
  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <div className="brand">
          <span className="brand__logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="36" height="36">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path
                d="M9 21l5-6 4 3 5-7"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h1 className="brand__name">ExpenseFlow</h1>
            <p className="brand__subtitle">Personal Expense &amp; Budget Tracker</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
