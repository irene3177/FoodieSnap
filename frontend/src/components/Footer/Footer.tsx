function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-footer border-t py-4 px-4 w-full cursor-default">
      <div className="max-w-[1200px] mx-auto text-center text-secondary text-sm">
        <p className="mb-2">
          © {currentYear} FoodieSnap. All rights reserved.
        </p>
        <p className="opacity-80">
          Powered by{' '}
          <a 
            href="https://www.themealdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover hover:underline transition-colors"
          >
            TheMealDB
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;