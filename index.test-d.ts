import {expectType} from 'tsd';
import pWaitFor from './index.js';

const controller = new AbortController();

expectType<Promise<void>>(pWaitFor(() => false));
expectType<Promise<void>>(pWaitFor(async () => false));
expectType<Promise<void>>(pWaitFor(() => true, {interval: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {timeout: 1}));
expectType<Promise<void>>(pWaitFor(() => true, {signal: controller.signal}));
expectType<Promise<void>>(pWaitFor(() => true, {before: false}));
expectType<Promise<number>>(pWaitFor(() => pWaitFor.resolveWith(1)));
expectType<Promise<number>>(pWaitFor(() => pWaitFor.resolveWith(1)));
expectType<Promise<number>>(pWaitFor(async () => true as boolean && pWaitFor.resolveWith(1)));
