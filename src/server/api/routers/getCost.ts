
export type Cost = {
    amountValue: string,
    itemTotalValue: string,
    discountPercentage: string,
    discountAmount: string,
    unitPrice: string,
    units: string,
}

export const getCost = (amountOfLicenses: number): Cost => {
    // if  5 > discount = 10%
    // if 10 > discount = 20%
    const unitPrice = 5; // $5 per license
    const multiplier = 1;
    const itemTotalValue = amountOfLicenses * unitPrice * multiplier;
    let discountPercentage = 0;
    let discountAmount = 0;
    let amountValue = 0;


    // if (amountOfLicenses >= 10) {
    //     return amount * 0.8;
    // }
    // if (amountOfLicenses >= 5) {
    //     return amount * 0.9;
    // }
    if (amountOfLicenses >= 5) {
        discountPercentage = 0.1;
    }
    if (amountOfLicenses >= 10) {
        discountPercentage = 0.2;
    }


    discountAmount = itemTotalValue * discountPercentage;
    amountValue = itemTotalValue - discountAmount;

    return {
        amountValue: amountValue.toString(),
        itemTotalValue: itemTotalValue.toString(),
        discountPercentage: discountPercentage.toString(),
        discountAmount: discountAmount.toString(),
        unitPrice: unitPrice.toString(),
        units: amountOfLicenses.toString(),
    };
};
