import React, {ChangeEvent, PropsWithChildren, ReactElement, useCallback, useState} from 'react';
import {validatorForUseForm, ValidatorConfigType} from "../validatorForUseForm";

function useForm<T>(initialData: T, validateOnChange: boolean, validatorConfig: ValidatorConfigType) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<{ [x: string]: string }>({});
  const [enterError, setEnterError] = useState<string | null>(null);

  const validate = useCallback(
      (data:any) => {
      const errors = validatorForUseForm(data, validatorConfig);
      setErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [validatorConfig, setErrors]
  );

  const handleInputChange = useCallback(
    ({ target }:ChangeEvent<HTMLInputElement>) => {
      const { name, value } = target;
      setData(prevState => ({
        ...prevState,
        [name]: value,
      }));
      setEnterError(null);
      setErrors({});
      if (validateOnChange) validate({ [name]: value });
    },
    [validateOnChange, validate]
  );


  const handleResetForm = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setData(initialData);
    setErrors({});
  };

  return {
    data,
    setData,
    errors,
    setErrors,
    enterError,
    setEnterError,
    handleInputChange,
    validate,
    handleResetForm,
  };
}

type FormType = {
  data: {
    [key: string]: any;
  };
  errors?: {
    [key: string]: any;
  };
  children?: React.ReactNode;
  handleKeyDown?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type FormItemProps = {
  name: string;
  data?: {
    [key: string]: any;
  };
  value?: string;
  error?: string;
  type?: string;
  props?: {
    [key: string]: any;
  };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function Form({ children, handleChange, data, errors, handleKeyDown, ...rest }: FormType) {
  const clonedElements = React.Children.map(children, child => {
    const item = child as ReactElement<PropsWithChildren<FormItemProps>>;
    const childType = typeof item;
    let config: FormItemProps = { name: '' };
    if (
      childType === 'object' ||
      (childType === 'function' && item.props.type !== 'submit' && item.props.type !== 'button')
    ) {
      config = {
        ...item.props,
        data: data,
        onChange: handleChange,
        value: data[item.props.name],
        error: errors?.[item.props.name],
      };
    }
    return React.cloneElement(item, config);
  });

  return (
    <form className='form' {...rest}>
      {clonedElements}
    </form>
  );
}

export { useForm, Form };