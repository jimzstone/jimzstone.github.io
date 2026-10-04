import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = vm.createContext({
  document: { getElementById: () => null },
  Date,
});
vm.runInContext(readFileSync('inquiry.js', 'utf8'), context);
assert.equal(context.inquiryPhoneValid('+63 991 353 6515'), true);
assert.equal(context.inquiryPhoneValid('abcd'), false);
assert.equal(context.inquiryPhoneValid('123'), false);
assert.equal(context.inquiryPhoneValid('+1234567890123456'), false);
assert.equal(
  context.inquiryAccepted({ success: 'true', message: 'Success' }),
  true,
);
assert.equal(context.inquiryAccepted({ success: false }), false);
assert.equal(
  context.inquiryAccepted({
    success: 'false',
    message: 'This form needs Activation',
  }),
  false,
);
assert.equal(
  context.inquiryAccepted({ success: true, message: 'Activation required' }),
  false,
);
assert.equal(context.inquiryToday(new Date(2026, 9, 5)), '2026-10-05');
console.log('Inquiry validation and response classification checks passed.');

