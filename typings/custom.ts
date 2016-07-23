interface NavigationHistory {
    description: string, 
    label: string, 
    detail: string,
    filePath : string,
    lineNumber: number,
    snapshot:string
}

interface Track {
    index: number,
    history: Array<NavigationHistory>,
    description: string, 
    label: string, 
    detail: string,
    recordCount:number
}