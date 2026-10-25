import Link from 'next/link';

const workbenchModules = [
  {
    href: '/intake/new',
    title: 'New change request',
    description: 'Create and submit a change request for approval.',
  },
  {
    href: '/reporting',
    title: 'Reporting',
    description: 'Review requests, filter records, view analytics, and export reports.',
  },
  {
    href: '/calendar',
    title: 'SLA calendar',
    description: 'See request due dates and identify overdue approvals.',
  },
];

export default function HomePage() {
  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">Change Request Workbench</h1>
      <p>Choose a workspace to get started.</p>
      <div className="workbench-modules">
        {workbenchModules.map((module) => (
          <article className="workbench-module" key={module.href}>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <Link href={module.href}>Open {module.title}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
