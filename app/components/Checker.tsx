/*
 * @Date: 2024-06-02 21:59:59
 * @LastEditors: nickyzhang
 * @LastEditTime: 2024-08-04 22:31:11
 * @FilePath: /dedata-front/app/components/Checker.tsx
 * @Description:
 */
'use client';

import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { Input, message, Radio } from 'antd';
import { useEffect, useState } from 'react';
import { getCheckerInfo, createCheckerInfo } from '@/app/lib/api';
import { SUCCESS_CODE } from '@/app/utils/constant';
import type { RadioChangeEvent } from 'antd';

const { TextArea } = Input;

function Checker({ roleStatus, applyStatus, languageStatus, onSaveChange, onExpiredTimeChange, type }: any) {
	const [checkerInfo, setCheckerInfo] = useState({
		content: '',
		makeList: [],
	});

	const [makerId, setMakerId] = useState(null);
	const { address, isConnected } = useAccount();
	const { signMessageAsync } = useSignMessage();

	useEffect(() => {
		async function loadData() {
			const dataType = type === 'alpha' ? 1 : 2;
			const { code, data, msg } = await getCheckerInfo(address, languageStatus, dataType);
			// console.log(code, data, msg);
			if (code === SUCCESS_CODE) {
				const { content, expiredTime } = data;
				setCheckerInfo({
					...data,
					content: content.replace('\n', '<br>') || '',
				});
				const timeDis = (expiredTime - Math.floor(Date.now())) / 1000;
				if (timeDis < 0) return;
				const minutes = Math.floor(timeDis / 60);
				const seconds = Math.floor(timeDis % 60);
				onExpiredTimeChange({
					minutes,
					seconds,
				});
			} else {
				message.error(msg);
				setTimeout(() => {
					onSaveChange();
				}, 2000);
			}
		}
		if (address && roleStatus === 2 && applyStatus) {
			loadData();
		}
	}, [roleStatus, address, applyStatus, languageStatus, onSaveChange, onExpiredTimeChange, type]);
	/**
	 * @description: verify save parameters
	 */
	async function validatorChecker() {
		if (!makerId) {
			message.info('Please finish current case');
			return;
		}
		onSubmit();
	}

	async function onSubmit() {
		const signatureStr = `makeId: ${makerId}`;

		const signature = await signMessageAsync({
			message: signatureStr,
		});

		const body = {
			makeId: makerId,
			address,
			signature,
		};

		const { code, msg } = await createCheckerInfo(body);
		if (code === SUCCESS_CODE) {
			message.info('Save successfully');
			setTimeout(() => {
				onSaveChange();
			}, 2000);
		} else {
			message.error(msg);
		}
	}

	const onRadioGroupChange = ({ target: { value } }: RadioChangeEvent) => {
		setMakerId(value);
	};

	if (roleStatus === 2 && applyStatus) {
		const checkerArr = (
			<Radio.Group onChange={onRadioGroupChange}>
				{checkerInfo?.makeList.map((item: any, index) => {
					return (
						<div
							className="bg-[#F5F7FA] px-[0.2rem] py-[0.08rem] rounded-[0.16rem] mb-[0.1rem]"
							key={index}
						>
							<Radio value={item.id}>{item.content}</Radio>
						</div>
					);
				})}
			</Radio.Group>
		);
		return (
			<div className="h-[calc(100%-0.4rem)] pt-[0.16rem]">
				<div className="flex flex-col h-full overflow-y-auto">
					<span className="text-[#000] text-[0.14rem] font-bold mb-[0.14rem]">Original Article</span>
					<div
						className="text-[#000] text-[0.14rem] leading-[0.22rem] bg-[#F5F7FA] px-[0.24rem] py-[0.16rem] rounded-[0.16rem]"
						dangerouslySetInnerHTML={{ __html: checkerInfo?.content }}
					/>
					<span className="text-[#000] text-[0.14rem] font-bold mt-[0.24rem] mb-[0.14rem]">
						Abstract
						<span className="text-[#999] text-[0.12rem] font-bold mt-[0.24rem] mb-[0.14rem]">
							（Choose the best summary of the news）
						</span>
					</span>
					{checkerArr}
					<div
						className="w-[2rem] h-[0.48rem] bg-[#3A54DF] text-[#fff] rounded-[0.16rem] leading-[0.48rem] text-center font-bold text-[0.18rem] mt-[0.08rem] cursor-pointer"
						onClick={validatorChecker}
					>
						Save
					</div>
				</div>
			</div>
		);
	}
	return null;
}

export default Checker;
