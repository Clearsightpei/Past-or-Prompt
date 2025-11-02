export default function StatCard(_a) {
    var title = _a.title, value = _a.value, description = _a.description, _b = _a.titleClassName, titleClassName = _b === void 0 ? "" : _b, _c = _a.valueClassName, valueClassName = _c === void 0 ? "" : _c;
    return (<div className="p-4 rounded-lg">
      <p className={"text-sm font-medium !text-black ".concat(titleClassName)}>{title}</p>
      <p className={"mt-1 text-3xl font-semibold !text-black ".concat(valueClassName)}>{value}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
    </div>);
}
