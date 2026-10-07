import { Button, DatePicker, Select, Space } from "antd";
import type { Dayjs } from "dayjs";
import type { CaseQuery } from "../../api/case";
import type { User } from "../../types";
import { CaseStatusLabels, CaseTypeLabels } from "../../types/enums";

type Range = [Dayjs | null, Dayjs | null] | null;

export function FilterBar({
  users,
  onChange
}: {
  users: User[];
  onChange: (query: CaseQuery) => void;
}) {
  const query: CaseQuery = {};

  return (
    <div className="toolbar-band">
      <Space wrap>
        <Select
          allowClear
          placeholder="案件类型"
          style={{ width: 140 }}
          options={Object.entries(CaseTypeLabels).map(([value, label]) => ({ value, label }))}
          onChange={(value) => {
            query.type = value;
            onChange({ ...query });
          }}
        />
        <Select
          allowClear
          placeholder="案件状态"
          style={{ width: 140 }}
          options={Object.entries(CaseStatusLabels).map(([value, label]) => ({ value, label }))}
          onChange={(value) => {
            query.status = value;
            onChange({ ...query });
          }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="主办/协办律师"
          style={{ width: 180 }}
          options={users.map((user) => ({ value: user.id, label: user.name }))}
          onChange={(value) => {
            query.lawyerId = value;
            onChange({ ...query });
          }}
        />
        <DatePicker.RangePicker
          onChange={(range: Range) => {
            query.startDate = range?.[0]?.format("YYYY-MM-DD");
            query.endDate = range?.[1]?.format("YYYY-MM-DD");
            onChange({ ...query });
          }}
        />
        <Button onClick={() => onChange({})}>重置</Button>
      </Space>
    </div>
  );
}

