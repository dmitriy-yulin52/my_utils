import {MutableRefObject, Ref, useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch} from 'react-redux';

/**
 * @function
 * @param initial: инициированное значение
 * @param dependence: от кого будем обновляться?
 * @return стейт с обновлением
 */
export function useStateWithInitialUpdate<T, D>(
    initial: T,
    dependence: D
): [T, (new_state: T) => void] {
    const [state, setState] = useState<T>(initial);
    useEffect(() => {
        setState(initial);
    }, [dependence]);
    return [state, setState];
}

/**
 * @function
 * Нужна для простоты использования булевых значений
 * @return [значение, поставить false, поставить true]
 */
export function useBooleanState(
    dflt: boolean
): [boolean, () => void, () => void, () => void] {
    const [state, setState] = useState(dflt);
    const setFalse = useCallback(() => setState(false), [setState]);
    const setTrue = useCallback(() => setState(true), [setState]);
    const toggle = useCallback(() => setState((current) => !current), [setState]);
    return [state, setFalse, setTrue, toggle];
}

/**
 * @function
 * Нужна для простоты использования всплывающих меню
 * @return [
 * ссылка на дом элемент, где кликали;
 * ссылка на DOM-элемент, где надо открыться;
 * открыть меню;
 * закрыть меню;
 * ]
 */

export function useRefAnchor<T extends Element>(): [
    null | T,
    Ref<T>,
    () => void,
    () => void
] {
    const ref = useRef<T>(null);
    const [anchor, setAnchor] = useState<T | null>(null);
    const open = useCallback(() => setAnchor(ref.current), [ref.current, setAnchor]);
    const close = useCallback(() => setAnchor(null), [setAnchor]);
    return [anchor, ref, open, close];
}

interface AbstractEventWithElement<T extends Element> extends AbstractEvent {
    currentTarget: T;
}

/**
 * @function
 * Нужна для простоты использования всплывающих меню
 * @return [ссылка на дом элемент, открыть меню, закрыть меню]
 */
export function useAnchor<T extends Element>(): [
    null | T,
    (event: AbstractEventWithElement<T>) => void,
    () => void
] {
    const [anchor, setAnchor] = useState<null | T>(null);
    const open = useCallback(
        (event: AbstractEventWithElement<T>) => {
            preventDefault(event);
            setAnchor(event.currentTarget);
        },
        [setAnchor]
    );
    const close = useCallback(() => setAnchor(null), [setAnchor]);
    return [anchor, open, close];
}

interface AbstractEvent {
    preventDefault(): void;
    stopPropagation(): void;
}
/**
 * @function
 * @param callback: функция, которая выполниться позже
 * @return мемоизированная функция, перед которой выполниться
 * preventDefault & stopPropagation
 */
export function usePreventDefault<E extends AbstractEvent>(
    callback: () => void
): (event: E) => void {
    return useCallback(
        (event: E) => {
            event.preventDefault();
            event.stopPropagation();
            callback();
        },
        [callback]
    );
}

export function preventDefault(event: AbstractEvent): void {
    event.preventDefault();
    event.stopPropagation();
}

/**
 * @function
 * @param action: функция, возвращающая action
 * @return мемоизированная функция, которая может обратиться к redux
 * useAction(f) --> dispatch(f())
 */
export function useAction<F extends (...args: any[]) => any>(
    action: F
): (...args: Parameters<F>) => void {
    const dispatch = useDispatch();
    return useCallback((...args: Parameters<F>) => dispatch(action(...args)), [
        dispatch,
        action,
    ]);
}

type RestArgs<F, P1 extends any[]> = F extends (...p1: [...P1, ...infer REST]) => any
    ? REST
    : void;

/**
 * @function
 * @param f: функция
 * @param p1: первый аргумент функции
 * @return функция, которая в момент вызова будет вести себя так,
 * как f(p1, ...args), т.е. с упрощённой сигнатурой
 * partial(f, ...p1)(...p2) --> f(...p1, ...p2)
 */
export function partial<P1 extends any[], F extends (...args: any[]) => any>(
    f: F,
    ...p1: P1
): (...p2: RestArgs<F, P1>) => ReturnType<F> {
    // return (...p2: RestArgs<F, P1>): ReturnType<F> => f(...p1, ...p2);
    return f.bind(null, ...p1);
}

/**
 * @function
 * @param f: функция
 * @param p1: первый аргумент функции
 * @return мемоизированная функция, которая в момент вызова будет вести себя так,
 * как f(p1, ...args)
 * usePartial(f, ...p1)(...p2) --> f(...p1, ...p2)
 */
export function usePartial<P1 extends any[], F extends (...args: any[]) => any>(
    f: F,
    ...p1: P1
): (...p2: RestArgs<F, P1>) => ReturnType<F> {
    return useCallback(partial(f, ...p1), [f, ...p1]);
}

/**
 * @function
 * @param functions: функции
 * @return функция, которая запустит все функции,
 * переданные в параметры
 */
export function callbacks<F extends (...args: any[]) => any>(
    functions: F[]
): (...args: Parameters<F>) => ReturnType<F>[] {
    return (...args: Parameters<F>) => functions.map((action) => action(...args));
}

/**
 * @function
 * @param functions: функции
 * @return мемоизированная функция, которая запустит все функции,
 * переданные в параметры
 */
export function useCallbacks<F extends (...args: any[]) => any>(
    functions: F[]
): (...args: Parameters<F>) => ReturnType<F>[] {
    return useCallback(callbacks(functions), functions);
}

/**
 * @function
 * @param list: массив элементов, которые могут быть null | undefined
 * @return чистый массив из элементов
 */
export function removeNulls<T>(list: (T | null | undefined)[]): T[] {
    return list.filter((x): x is T => x != null);
}

/**
 * Создаёт мутабельный ref-объект, со значением value.
 * Значение поддерживается актуальным с помощью useEffect.
 * Это может быть полезно в таком сценарии:
 *
 * function Adder({value, onSet}) {
 *     const valueBox = useBox(value);
 *
 *     const onClick = useCallback(() => {
 *         onSet(valueBox + 1);
 *     }, [onSet]);
 *     // ↑ обратите внимание, что в зависимостях только onSet, но не value и не valueBox
 *     // Это позволяет дочернему компоненту не ререндериться при изменении value, ведь
 *     // коллбэк onClick не пересоздаётся.
 *
 *     return <button onClick={onClick}>add one</button>;
 * }
 *
 * const [value, setValue] = useState(0);
 *
 * <Adder value={value} onSet={setValue}/>
 *
 * @param value  значение, которое нужно положить в ref
 * @returns {any}  текущее значение ref'а
 */
export function useBox<T>(value: T): MutableRefObject<T> {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
}
