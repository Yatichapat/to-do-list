interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  titleColor?: string;
}

export default function SuccessCard({
  icon,
  title,
  subtitle,
  titleColor = "text-green-600",
}: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white p-10 text-center shadow-lg">
        <div className="mb-6 mr-4 flex justify-center text-[120px] text-yellow-500">{icon}</div>
        <h1 className={`mb-2 text-2xl font-bold ${titleColor}`}>{title}</h1>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}
