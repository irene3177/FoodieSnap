import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__content">
        <p className="footer__copyright">
          © {currentYear} FoodieSnap. All rights reserved.
        </p>
        <p className="footer__credits">
          Powered by{' '}
          <a 
            href="https://www.themealdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            TheMealDB
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;