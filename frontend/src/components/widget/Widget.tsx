import Card from "components/card";

type StatusType = "success" | "warning" | "danger" | "default";

const statusColors: Record<StatusType, string> = {
  success:
    "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400",
  danger: "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400",
  default: "bg-lightPrimary text-brand-500 dark:bg-navy-700 dark:text-white",
};

const Widget = (props: {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  onClick?: () => void;
  status?: StatusType;
}) => {
  const { icon, title, subtitle, onClick, status = "default" } = props;
  return (
    <Card
      extra={`!flex-row flex-grow items-center rounded-[20px] ${
        onClick ? "cursor-pointer transition hover:shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      <div className="ml-[18px] flex h-[90px] w-auto flex-row items-center">
        <div className={`rounded-full p-3 ${statusColors[status]}`}>
          <span className="flex items-center">{icon}</span>
        </div>
      </div>

      <div className="h-50 ml-4 flex w-auto flex-col justify-center">
        <p className="font-dm text-sm font-medium text-gray-600">{title}</p>
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {subtitle}
        </h4>
      </div>
    </Card>
  );
};

export default Widget;
