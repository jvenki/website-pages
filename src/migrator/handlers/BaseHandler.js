// @flow
export type CheerioElemType = Function;
export type CheerioDocType = Function;
export type ConversionResultType = {elements: Array<Object>, issues?: Array<string>};
export type ExecutionResultType = {targetElements: Array<Object>, issues: Array<string>};

export default class BaseHandler {
    getName(): string {
        return this.constructor.name;
    }

    isCapableOfProcessingElement($element: CheerioElemType): boolean {
        throw new Error("Child Class should override this method");
    }

    validate($element: CheerioElemType, $: CheerioDocType): void {
        // Child class should validate and throw an Error if the element doesnt confirm to the expectation
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        return [$element];
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        throw new Error("Child Class should override this method");
    }

    execute(sourceElements: Array<CheerioElemType>, $: CheerioDocType): ExecutionResultType {
        sourceElements.forEach(($sourceElement) => {
            this.validate($sourceElement, $);
        });
        const {elements: targetElements, issues} = this.convert(sourceElements, $);
        return {targetElements, issues: issues || []};
    }
}
