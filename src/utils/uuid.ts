import { v4 as uuidv4 } from 'uuid';

export const generateButtonId = (): string => {
  return `btn_${uuidv4()}`;
};

export const generateListRowId = (): string => {
  return `row_${uuidv4()}`;
};

export const generateListSectionId = (): string => {
  return `sec_${uuidv4()}`;
};