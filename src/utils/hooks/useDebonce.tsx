import {useEffect, useMemo, useState} from "react";
import {debounce, DebouncedFunc} from "lodash";
import {useLatest} from "./useLatest";


export default function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay || 500);
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function useDebounceWithUseLatest<T extends (...args: any) => any>(callback: T, delay: number): DebouncedFunc<(...args: any[]) => any> {
    const latestCb = useLatest(callback);
    return useMemo(() => debounce((...args) => latestCb.current(...args), delay), [delay, latestCb]);
}


export function makeDebouncedHook<T extends (...args: any) => any>(func: T) {
    return function useDebounceWithUseLatest<T extends (...args: any) => any>(callback: T, delay: number): DebouncedFunc<(...args: any[]) => any> {
        const latestCb = useLatest(callback);
        const debouncedFunc =  useMemo(() => func((...args:any) => latestCb.current(...args), delay), [delay, latestCb]);

        useEffect(()=>{
            return ()=> debouncedFunc.cancel()
        },[debouncedFunc])

        return debouncedFunc
    };
}
