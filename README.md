# Sarthak Bhandari — Portfolio AI

A **premium, AI-powered developer portfolio** built with PHP 8, MySQL, vanilla CSS, and vanilla JavaScript. Designed with a dark futuristic aesthetic featuring glassmorphism, micro-animations, and a full design token system.

---

## 🚀 Quick Start

### Prerequisites
- XAMPP (Apache + MySQL) or any PHP 8.1+ server
- PHP 8.1 or higher
- MySQL 8.0 or MariaDB 10.6+

### Installation

```bash
# 1. Clone / copy this folder into your web root
#    (e.g. /Applications/XAMPP/xamppfiles/htdocs/Portfolio-ai)

# 2. Import the database schema
mysql -u root -p < database.sql

# 3. Configure the database connection
#    Edit includes/db.php and set your credentials:
#      DB_HOST, DB_NAME, DB_USER, DB_PASS

# 4. Start Apache & MySQL in XAMPP, then visit:
#    http://localhost/Portfolio-ai/
```

---

## 📁 Project Structure

```
Portfolio-ai/
├── index.php                 # Public homepage (entry point)
├── database.sql              # Full MySQL schema + seed data
├── README.md
│
├── includes/
│   ├── db.php                # PDO singleton database connection
│   ├── functions.php         # Shared utility functions
│   ├── header.php            # Global HTML header & nav
│   └── footer.php            # Global HTML footer & scripts
│
├── assets/
│   ├── css/
│   │   └── style.css         # Design system — tokens, layout, components
│   └── js/
│       └── main.js           # Nav, typed text, scroll-reveal, smooth scroll
│
└── uploads/
    ├── profile/              # Profile avatar uploads
    └── projects/             # Project thumbnail uploads
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary Accent | `#7c3aed` (Violet) |
| Secondary Accent | `#06b6d4` (Cyan) |
| Base Background | `#080810` |
| Font (Headings) | Space Grotesk |
| Font (Body) | Inter |
| Font (Code) | JetBrains Mono |

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `users` | Admin accounts |
| `profile` | Bio, avatar, contact info |
| `skills` | Skills with proficiency levels |
| `projects` | Portfolio projects |
| `experience` | Work history |
| `contact_messages` | Contact form submissions |
| `settings` | Key-value site configuration |

---

## 🛣️ Build Roadmap

- [x] **Phase 1** — Project foundation (current)
  - File structure, DB schema, design system, homepage
- [ ] **Phase 2** — Full portfolio sections
  - About, Skills, Projects, Experience, Contact
- [ ] **Phase 3** — Admin panel
  - Login, dashboard, CRUD for all content
- [ ] **Phase 4** — AI features
  - AI bio writer, project summariser, chatbot assistant

---

## 🔒 Security Notes

- All user output is escaped via `e()` (htmlspecialchars)
- CSRF protection via session tokens (`csrf_token()`)
- Database queries use PDO prepared statements exclusively
- Upload directories should be restricted from direct PHP execution (configure `.htaccess` in production)

---

## 📄 License

MIT — feel free to adapt for your own portfolio.

---

*Built with 💜 by Sarthak Bhandari*
