import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  collapsed: boolean;
}

const links = [
  { href: '/intake/new', label: 'New intake' },
  { href: '/reporting', label: 'Reporting' },
  { href: '/calendar', label: 'Calendar' },
];

export function Sidebar({ collapsed }: SidebarProps) {
  const { asPath } = useRouter();

  return (
    <nav
      aria-label="Main navigation"
      className={`app-sidebar${collapsed ? ' app-sidebar-collapsed' : ''}`}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={asPath === link.href ? 'page' : undefined}
          title={collapsed ? link.label : undefined}
        >
          {collapsed ? link.label.slice(0, 1) : link.label}
        </Link>
      ))}
    </nav>
  );
}
