const DEFAULT_OPERATOR = { id: 'u-002', name: '王芳' };

export interface OperatorInfo {
  id: string;
  name: string;
}

export function getOperator(req: any): OperatorInfo {
  const rawName = (req.headers['x-operator-name'] as string) || DEFAULT_OPERATOR.name;
  return {
    id: (req.headers['x-operator-id'] as string) || DEFAULT_OPERATOR.id,
    name: decodeURIComponent(rawName),
  };
}
