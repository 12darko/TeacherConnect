import { Link } from "wouter";

interface SubjectCardProps {
  id: number;
  name: string;
  icon: string;
}

export default function SubjectCard({ id, name, icon }: SubjectCardProps) {
  return (
    <Link href={`/find-teachers?subject=${id}`}>
      <a className="bg-neutral-lightest hover:bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center transition duration-150 h-32">
        <span className="material-icons text-3xl text-primary mb-2">{icon}</span>
        <span className="text-center font-medium text-neutral-dark">{name}</span>
      </a>
    </Link>
  );
}
