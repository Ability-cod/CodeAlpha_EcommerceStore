export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>© {new Date().getFullYear()} CodeAlpha Store. All rights reserved.</span>
        <span>Built for the CodeAlpha Full Stack Development Internship</span>
      </div>
    </footer>
  );
}